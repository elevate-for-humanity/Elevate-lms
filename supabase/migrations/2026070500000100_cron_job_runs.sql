-- cron_job_runs: observability table for every cron execution
-- Written by withRuntime on each cron handler invocation.

create table if not exists public.cron_job_runs (
  id            uuid primary key default gen_random_uuid(),
  job_name      text not null,
  status        text not null check (status in ('running', 'success', 'failed')),
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  duration_ms   integer,
  result        jsonb,
  error         text,
  created_at    timestamptz not null default now()
);

create index if not exists cron_job_runs_job_name_idx  on public.cron_job_runs (job_name);
create index if not exists cron_job_runs_started_at_idx on public.cron_job_runs (started_at desc);
create index if not exists cron_job_runs_status_idx     on public.cron_job_runs (status);

-- Only service role can write; no RLS needed (internal table)
alter table public.cron_job_runs enable row level security;

create policy "service_role_all" on public.cron_job_runs
  for all to service_role using (true) with check (true);
