alter table public.video_jobs
  add column if not exists review_status text not null default 'not_ready',
  add column if not exists previous_video_url text,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text,
  add column if not exists quality_evidence jsonb,
  add column if not exists procedure_schema jsonb;

alter table public.video_jobs drop constraint if exists video_jobs_review_status_check;
alter table public.video_jobs add constraint video_jobs_review_status_check
  check (review_status in ('not_ready', 'pending_review', 'approved', 'rejected'));

create table if not exists public.lesson_video_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  video_job_id uuid references public.video_jobs(id) on delete set null,
  video_url text not null,
  caption_url text,
  transcript_url text,
  duration_seconds numeric,
  scene_count integer,
  quality_evidence jsonb,
  procedure_schema jsonb,
  status text not null check (status in ('active', 'archived', 'rejected')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists lesson_video_versions_one_active
  on public.lesson_video_versions (lesson_id) where status = 'active';
alter table public.lesson_video_versions enable row level security;
drop policy if exists "staff manage lesson video versions" on public.lesson_video_versions;
create policy "staff manage lesson video versions" on public.lesson_video_versions
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff','super_admin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff','super_admin')));
