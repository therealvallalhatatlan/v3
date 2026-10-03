-- Reduce the free plan to three image generations and keep existing free users within the new limit.
alter table public.profiles
  alter column generation_credits set default 3;

update public.profiles
set generation_credits = least(generation_credits, 3),
    updated_at = now()
where plan = 'free';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan, generation_credits, character_slots)
  values (new.id, new.email, 'free', 3, 0) on conflict (id) do nothing;
  insert into public.credit_transactions (user_id, type, amount, reference)
  values (new.id, 'free_grant', 3, 'signup');
  return new;
end;
$$;
