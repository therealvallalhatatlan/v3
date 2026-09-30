-- Persistent video generation jobs and Supabase Storage support.
-- Run this migration against the same Supabase project as the existing v3 schema.

create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  character_ids jsonb not null default '[]'::jsonb,
  duo_key text,
  source_image_url text not null,
  last_frame_image_url text,
  prompt text not null,
  duration_seconds integer not null default 5 check (duration_seconds between 1 and 20),
  provider text not null default 'replicate',
  external_job_id text,
  status text not null default 'queued' check (status in ('queued','processing','done','failed','canceled')),
  video_storage_path text,
  provider_video_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists video_jobs_user_id_idx
  on public.video_jobs(user_id);

create index if not exists video_jobs_character_id_idx
  on public.video_jobs(character_id);

create index if not exists video_jobs_external_job_id_idx
  on public.video_jobs(external_job_id);

create index if not exists video_jobs_status_idx
  on public.video_jobs(status);

alter table public.video_jobs enable row level security;

drop policy if exists "own_video_jobs_select" on public.video_jobs;
create policy "own_video_jobs_select"
  on public.video_jobs for select
  using (user_id = auth.uid());

drop policy if exists "own_video_jobs_insert" on public.video_jobs;
create policy "own_video_jobs_insert"
  on public.video_jobs for insert
  with check (user_id = auth.uid());

drop policy if exists "own_video_jobs_update" on public.video_jobs;
create policy "own_video_jobs_update"
  on public.video_jobs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep the existing private media bucket, but make video objects user-owned
-- by the first path segment, just like the existing character media.
insert into storage.buckets (id, name, public)
values ('v3-media', 'v3-media', false)
on conflict (id) do nothing;

drop policy if exists "v3_media_video_insert" on storage.objects;
create policy "v3_media_video_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'v3-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "v3_media_video_select" on storage.objects;
create policy "v3_media_video_select"
  on storage.objects for select
  using (
    bucket_id = 'v3-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "v3_media_video_delete" on storage.objects;
create policy "v3_media_video_delete"
  on storage.objects for delete
  using (
    bucket_id = 'v3-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
