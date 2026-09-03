-- workflow_step_logs: per-step execution trace for every workflow run
create table if not exists public.workflow_step_logs (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references public.workflow_runs(id) on delete cascade,
  step_id      uuid,
  step_order   integer,
  action_type  text,
  status       text not null check (status in ('success', 'failed', 'skipped')),
  attempts     integer not null default 1,
  duration_ms  integer,
  output       jsonb,
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists workflow_step_logs_run_id_idx    on public.workflow_step_logs (run_id);
create index if not exists workflow_step_logs_created_at_idx on public.workflow_step_logs (created_at desc);

-- workflow_dead_letters: steps that exhausted all retries
create table if not exists public.workflow_dead_letters (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  uuid,
  run_id       uuid references public.workflow_runs(id) on delete set null,
  step_id      uuid,
  action_type  text,
  action_config jsonb,
  attempts     integer not null default 3,
  last_error   text,
  payload      jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists workflow_dead_letters_workflow_id_idx on public.workflow_dead_letters (workflow_id);
create index if not exists workflow_dead_letters_created_at_idx  on public.workflow_dead_letters (created_at desc);

-- RLS: service role only
alter table public.workflow_step_logs   enable row level security;
alter table public.workflow_dead_letters enable row level security;

create policy "service_role_all" on public.workflow_step_logs
  for all to service_role using (true) with check (true);

create policy "service_role_all" on public.workflow_dead_letters
  for all to service_role using (true) with check (true);
