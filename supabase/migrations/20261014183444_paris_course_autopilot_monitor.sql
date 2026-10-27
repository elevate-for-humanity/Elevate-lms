-- Isolate supervision from worker payload writes and instructional input hashes.
alter table public.ultimate_build_jobs
  add column if not exists monitor jsonb not null default '{"enabled":false}'::jsonb;
comment on column public.ultimate_build_jobs.monitor is
  'PARIS queue supervision: bounded recoveries and observed state. Not proof of execution or release.';
-- Existing service-role-only queue access and RLS remain in force.
