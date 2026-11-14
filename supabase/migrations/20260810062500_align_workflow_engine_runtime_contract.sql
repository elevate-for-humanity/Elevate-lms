alter table public.workflow_runs
  add column if not exists duration_ms integer,
  add column if not exists retry_count integer not null default 0,
  add column if not exists platform_event_id uuid references public.platform_events(id) on delete set null;

alter table public.workflow_step_logs
  add column if not exists attempts integer not null default 1;

create index if not exists workflow_runs_platform_event_id_idx
  on public.workflow_runs(platform_event_id)
  where platform_event_id is not null;

create unique index if not exists workflow_runs_event_workflow_uidx
  on public.workflow_runs(platform_event_id, workflow_id)
  where platform_event_id is not null;
