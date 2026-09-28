-- Conversational image editing
-- Run this migration against the same Supabase project as the existing v3 schema.

alter table public.generated_images
  add column if not exists parent_generation_id uuid references public.generated_images(id) on delete set null,
  add column if not exists edit_session_id uuid,
  add column if not exists edit_instruction text,
  add column if not exists edit_response text,
  add column if not exists edit_index integer not null default 0,
  add column if not exists gemini_interaction_id text,
  add column if not exists edit_context jsonb;

create index if not exists generated_images_parent_generation_id_idx
  on public.generated_images(parent_generation_id);

create index if not exists generated_images_edit_session_id_idx
  on public.generated_images(edit_session_id);

create index if not exists generated_images_gemini_interaction_id_idx
  on public.generated_images(gemini_interaction_id);

create table if not exists public.image_edit_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  root_generation_id uuid references public.generated_images(id) on delete set null,
  current_generation_id uuid references public.generated_images(id) on delete set null,
  gemini_interaction_id text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.image_edit_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.image_edit_sessions(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null default '',
  generation_id uuid references public.generated_images(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.generated_images
  drop constraint if exists generated_images_edit_session_id_fkey;

alter table public.generated_images
  add constraint generated_images_edit_session_id_fkey
  foreign key (edit_session_id) references public.image_edit_sessions(id) on delete set null;

create index if not exists image_edit_sessions_owner_id_idx
  on public.image_edit_sessions(owner_id);

create index if not exists image_edit_messages_session_id_idx
  on public.image_edit_messages(session_id);

create index if not exists image_edit_messages_owner_id_idx
  on public.image_edit_messages(owner_id);

alter table public.image_edit_sessions enable row level security;
alter table public.image_edit_messages enable row level security;

drop policy if exists "own_image_edit_sessions_select" on public.image_edit_sessions;
create policy "own_image_edit_sessions_select"
  on public.image_edit_sessions for select
  using (owner_id = auth.uid());

drop policy if exists "own_image_edit_sessions_insert" on public.image_edit_sessions;
create policy "own_image_edit_sessions_insert"
  on public.image_edit_sessions for insert
  with check (owner_id = auth.uid());

drop policy if exists "own_image_edit_sessions_update" on public.image_edit_sessions;
create policy "own_image_edit_sessions_update"
  on public.image_edit_sessions for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "own_image_edit_messages_select" on public.image_edit_messages;
create policy "own_image_edit_messages_select"
  on public.image_edit_messages for select
  using (owner_id = auth.uid());

drop policy if exists "own_image_edit_messages_insert" on public.image_edit_messages;
create policy "own_image_edit_messages_insert"
  on public.image_edit_messages for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.image_edit_sessions s
      where s.id = session_id
        and s.owner_id = auth.uid()
    )
  );
