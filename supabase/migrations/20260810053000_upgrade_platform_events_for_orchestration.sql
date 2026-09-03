alter table public.platform_events
  add column if not exists source text,
  add column if not exists correlation_id text,
  add column if not exists idempotency_key text,
  add column if not exists tenant_id uuid,
  add column if not exists processing_status text not null default 'observed',
  add column if not exists attempts integer not null default 0,
  add column if not exists available_at timestamptz not null default now(),
  add column if not exists last_error text;

create unique index if not exists platform_events_idempotency_key_uidx
  on public.platform_events (idempotency_key)
  where idempotency_key is not null;

create index if not exists platform_events_pending_idx
  on public.platform_events (processing_status, available_at, created_at)
  where processing_status in ('pending','processing','failed');

create index if not exists platform_events_correlation_idx
  on public.platform_events (correlation_id, created_at desc)
  where correlation_id is not null;

create index if not exists platform_events_tenant_idx
  on public.platform_events (tenant_id, created_at desc)
  where tenant_id is not null;

comment on table public.platform_events is
  'Canonical cross-platform event ledger for identity, commerce, billing, entitlement, provisioning, workflow, LMS, workforce, and AI orchestration.';
