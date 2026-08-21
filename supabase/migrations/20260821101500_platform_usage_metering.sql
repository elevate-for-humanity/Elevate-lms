begin;

create table if not exists public.platform_usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_id uuid null,
  source text not null,
  metric text not null,
  quantity numeric(18,6) not null check (quantity >= 0),
  unit text not null,
  external_ref text null,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists platform_usage_events_tenant_occurred_idx
  on public.platform_usage_events (tenant_id, occurred_at desc);

create index if not exists platform_usage_events_metric_occurred_idx
  on public.platform_usage_events (metric, occurred_at desc);

create index if not exists platform_usage_events_external_ref_idx
  on public.platform_usage_events (external_ref)
  where external_ref is not null;

alter table public.platform_usage_events enable row level security;

revoke all on table public.platform_usage_events from public, anon, authenticated;
grant select, insert, update, delete on table public.platform_usage_events to service_role;

create or replace function public.record_platform_usage_v1(
  p_tenant_id uuid,
  p_source text,
  p_metric text,
  p_quantity numeric,
  p_unit text,
  p_idempotency_key text,
  p_external_ref text default null,
  p_actor_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  if p_tenant_id is null then
    raise exception 'tenant_id is required';
  end if;
  if coalesce(trim(p_source), '') = '' or coalesce(trim(p_metric), '') = '' then
    raise exception 'source and metric are required';
  end if;
  if p_quantity is null or p_quantity < 0 then
    raise exception 'quantity must be non-negative';
  end if;
  if coalesce(trim(p_unit), '') = '' or coalesce(trim(p_idempotency_key), '') = '' then
    raise exception 'unit and idempotency_key are required';
  end if;

  insert into public.platform_usage_events (
    tenant_id, actor_id, source, metric, quantity, unit,
    external_ref, idempotency_key, metadata, occurred_at
  ) values (
    p_tenant_id, p_actor_id, trim(p_source), trim(p_metric), p_quantity,
    trim(p_unit), nullif(trim(coalesce(p_external_ref, '')), ''),
    trim(p_idempotency_key), coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_occurred_at, now())
  )
  on conflict (idempotency_key)
  do update set
    quantity = excluded.quantity,
    unit = excluded.unit,
    metadata = excluded.metadata,
    occurred_at = excluded.occurred_at
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_platform_usage_v1(uuid,text,text,numeric,text,text,text,uuid,jsonb,timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_platform_usage_v1(uuid,text,text,numeric,text,text,text,uuid,jsonb,timestamptz)
  to service_role;

create or replace view public.platform_usage_monthly as
select
  tenant_id,
  date_trunc('month', occurred_at) as usage_month,
  metric,
  unit,
  sum(quantity) as quantity,
  count(*) as event_count
from public.platform_usage_events
group by tenant_id, date_trunc('month', occurred_at), metric, unit;

revoke all on public.platform_usage_monthly from public, anon, authenticated;
grant select on public.platform_usage_monthly to service_role;

commit;
