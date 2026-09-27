-- Vállalhatatlan v3 multi-user SaaS foundation
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free','paid','admin')),
  generation_credits integer not null default 6 check (generation_credits >= 0),
  character_slots integer not null default 0 check (character_slots >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  type text not null default 'user' check (type in ('system','user')),
  name text not null,
  description text not null default '',
  traits jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.character_images (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  storage_path text not null,
  image_type text not null default 'reference',
  created_at timestamptz not null default now()
);

create table if not exists public.generation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('success','failed')),
  provider text not null default 'gemini',
  credits integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists generation_events_user_id_idx on public.generation_events(user_id);

create table if not exists public.generated_images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  character_ids jsonb not null default '[]'::jsonb,
  storage_path text not null,
  prompt text,
  style text,
  camera text,
  aspect_ratio text,
  variant text,
  credit_cost integer not null default 1 check (credit_cost > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('free_grant','purchase','reserve','consume','refund','admin_adjustment')),
  amount integer not null,
  reference text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_payment_id text unique,
  package_id text not null,
  credits integer not null default 0 check (credits >= 0),
  character_slots integer not null default 0 check (character_slots >= 0),
  amount integer not null,
  currency text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists characters_owner_id_idx on public.characters(owner_id);
create index if not exists generated_images_owner_id_idx on public.generated_images(owner_id);
create index if not exists generated_images_character_id_idx on public.generated_images(character_id);
create index if not exists credit_transactions_user_id_idx on public.credit_transactions(user_id);
create index if not exists purchases_user_id_idx on public.purchases(user_id);

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.character_images enable row level security;
alter table public.generation_events enable row level security;
alter table public.generated_images enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "system_or_owned_characters_select" on public.characters;
create policy "system_or_owned_characters_select" on public.characters
  for select using (type = 'system' or owner_id = auth.uid());

drop policy if exists "owned_characters_insert" on public.characters;
create policy "owned_characters_insert" on public.characters
  for insert with check (type = 'user' and owner_id = auth.uid());

drop policy if exists "owned_characters_update" on public.characters;
create policy "owned_characters_update" on public.characters
  for update using (type = 'user' and owner_id = auth.uid())
  with check (type = 'user' and owner_id = auth.uid());

drop policy if exists "owned_characters_delete" on public.characters;
create policy "owned_characters_delete" on public.characters
  for delete using (type = 'user' and owner_id = auth.uid());

drop policy if exists "owned_character_images_select" on public.character_images;
create policy "owned_character_images_select" on public.character_images
  for select using (
    exists (
      select 1 from public.characters c
      where c.id = character_id and (c.type = 'system' or c.owner_id = auth.uid())
    )
  );

drop policy if exists "own_generation_events_select" on public.generation_events;
create policy "own_generation_events_select" on public.generation_events
  for select using (user_id = auth.uid());

drop policy if exists "owned_generated_images_select" on public.generated_images;
create policy "owned_generated_images_select" on public.generated_images
  for select using (owner_id = auth.uid());

drop policy if exists "owned_generated_images_insert" on public.generated_images;
create policy "owned_generated_images_insert" on public.generated_images
  for insert with check (owner_id = auth.uid());

drop policy if exists "own_transactions_select" on public.credit_transactions;
create policy "own_transactions_select" on public.credit_transactions
  for select using (user_id = auth.uid());

drop policy if exists "own_purchases_select" on public.purchases;
create policy "own_purchases_select" on public.purchases
  for select using (user_id = auth.uid());

-- Creates/updates a profile after Supabase Auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan, generation_credits, character_slots)
  values (new.id, new.email, 'free', 6, 0)
  on conflict (id) do nothing;

  insert into public.credit_transactions (user_id, type, amount, reference)
  values (new.id, 'free_grant', 6, 'signup')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atomically reserve generation credits.
create or replace function public.reserve_generation_credits(p_user_id uuid, p_cost integer default 1)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if p_cost <= 0 then
    return false;
  end if;

  update public.profiles
  set generation_credits = generation_credits - p_cost,
      updated_at = now()
  where id = p_user_id
    and generation_credits >= p_cost;

  get diagnostics affected = row_count;
  if affected <> 1 then
    return false;
  end if;

  insert into public.credit_transactions (user_id, type, amount, reference)
  values (p_user_id, 'reserve', -p_cost, 'generation');

  return true;
end;
$$;

create or replace function public.refund_generation_credits(p_user_id uuid, p_cost integer, p_reference text default 'generation_error')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_cost <= 0 then
    return false;
  end if;

  update public.profiles
  set generation_credits = generation_credits + p_cost,
      updated_at = now()
  where id = p_user_id;

  if not found then
    return false;
  end if;

  insert into public.credit_transactions (user_id, type, amount, reference)
  values (p_user_id, 'refund', p_cost, p_reference);

  return true;
end;
$$;
