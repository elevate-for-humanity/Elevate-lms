-- Combined AI observation stream; existing work queues remain authoritative.
create table if not exists public.paris_runtime_events (
  id uuid primary key default gen_random_uuid(),
  identity text not null default 'PARIS' check (identity = 'PARIS'),
  kind text not null check (kind in ('inference','command','workflow')),
  operation text not null,
  status text not null check (status in ('completed','failed','blocked','approval_required','running','advisory')),
  actor_id uuid,
  correlation_id text,
  provider text,
  duration_ms integer not null check (duration_ms >= 0),
  failure_category text,
  recovery text,
  next_action text,
  created_at timestamptz not null default now()
);
create index if not exists paris_runtime_events_recent on public.paris_runtime_events(created_at desc);
create index if not exists paris_runtime_events_actor on public.paris_runtime_events(actor_id, created_at desc);
alter table public.paris_runtime_events enable row level security;
revoke all on public.paris_runtime_events from public, anon, authenticated;
grant select, insert, delete on public.paris_runtime_events to service_role;
create policy paris_runtime_events_service on public.paris_runtime_events for all to service_role using (true) with check (true);
comment on table public.paris_runtime_events is 'PARIS combined runtime observations; no prompt, response, secret, or autonomous replay payload.';
-- Bound telemetry storage without consuming inference or introducing another queue.
select cron.schedule('paris-runtime-observation-retention', '17 3 * * *',
  $$delete from public.paris_runtime_events where created_at < now() - interval '30 days'$$);
