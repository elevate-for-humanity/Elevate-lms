-- Commercial subscription + durable AI runtime hardening.
-- Applied to production on 2026-08-11.

create table if not exists public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  stripe_invoice_id text not null unique,
  subscription_id text not null,
  customer_id text,
  amount_paid integer not null default 0,
  amount_due integer not null default 0,
  status text not null,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  invoice_url text,
  failure_message text,
  attempt_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscription_invoices_subscription_idx on public.subscription_invoices(subscription_id, created_at desc);

alter table public.ai_tasks add column if not exists agent_type text;
alter table public.ai_tasks add column if not exists intent text;
alter table public.ai_tasks add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.ai_tasks add column if not exists attempts integer not null default 0;
alter table public.ai_tasks add column if not exists max_attempts integer not null default 3;
alter table public.ai_tasks add column if not exists timeout_ms integer not null default 300000;
alter table public.ai_tasks add column if not exists correlation_id text;
alter table public.ai_tasks add column if not exists metadata jsonb not null default '{}'::jsonb;
create index if not exists ai_tasks_runtime_status_idx on public.ai_tasks(status, priority, created_at);
create index if not exists ai_tasks_runtime_correlation_idx on public.ai_tasks(correlation_id);
create index if not exists ai_tasks_runtime_tenant_idx on public.ai_tasks(tenant_id, created_at desc);

create table if not exists public.ai_tool_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.ai_tasks(id) on delete set null,
  tool_name text not null,
  actor_id uuid,
  tenant_id uuid,
  risk_level text not null default 'low' check (risk_level in ('low','medium','high','critical')),
  requires_approval boolean not null default false,
  approval_status text not null default 'not_required' check (approval_status in ('not_required','pending','approved','rejected')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','pending_approval')),
  idempotency_key text,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists ai_tool_runs_idempotency_uq on public.ai_tool_runs(idempotency_key) where idempotency_key is not null;
create index if not exists ai_tool_runs_actor_idx on public.ai_tool_runs(actor_id, created_at desc);
create index if not exists ai_tool_runs_tenant_idx on public.ai_tool_runs(tenant_id, created_at desc);
create index if not exists ai_tool_runs_status_idx on public.ai_tool_runs(status, created_at);

create table if not exists public.ai_gateway_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null default gen_random_uuid(),
  agent_type text not null,
  intent text not null default 'GENERAL',
  message text not null,
  context jsonb not null default '{}'::jsonb,
  response jsonb,
  latency_ms integer,
  status text not null default 'success',
  correlation_id text,
  tenant_id uuid,
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists ai_gateway_logs_created_idx on public.ai_gateway_logs(created_at desc);
create index if not exists ai_gateway_logs_correlation_idx on public.ai_gateway_logs(correlation_id);

create table if not exists public.ai_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text not null,
  data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  correlation_id text,
  tenant_id uuid,
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists ai_events_created_idx on public.ai_events(created_at desc);
create index if not exists ai_events_correlation_idx on public.ai_events(correlation_id);

create table if not exists public.ai_scoped_memory (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('user','tenant','program','agent')),
  scope_id text not null,
  memory_key text not null,
  memory_value jsonb not null,
  source text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scope_type, scope_id, memory_key)
);
create index if not exists ai_scoped_memory_lookup_idx on public.ai_scoped_memory(scope_type, scope_id, updated_at desc);

alter table public.subscription_invoices enable row level security;
alter table public.ai_tool_runs enable row level security;
alter table public.ai_gateway_logs enable row level security;
alter table public.ai_events enable row level security;
alter table public.ai_scoped_memory enable row level security;

drop policy if exists "service role subscription invoices" on public.subscription_invoices;
create policy "service role subscription invoices" on public.subscription_invoices for all to service_role using (true) with check (true);
drop policy if exists "service role ai tool runs" on public.ai_tool_runs;
create policy "service role ai tool runs" on public.ai_tool_runs for all to service_role using (true) with check (true);
drop policy if exists "service role ai gateway logs" on public.ai_gateway_logs;
create policy "service role ai gateway logs" on public.ai_gateway_logs for all to service_role using (true) with check (true);
drop policy if exists "service role ai events" on public.ai_events;
create policy "service role ai events" on public.ai_events for all to service_role using (true) with check (true);
drop policy if exists "service role ai scoped memory" on public.ai_scoped_memory;
create policy "service role ai scoped memory" on public.ai_scoped_memory for all to service_role using (true) with check (true);

create or replace function public.close_managed_trial_on_paid_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stripe_subscription_id is not null and new.status in ('active','trialing') then
    update public.managed_licenses
      set status = 'canceled',
          canceled_at = coalesce(canceled_at, now()),
          stripe_subscription_id = new.stripe_subscription_id,
          stripe_customer_id = new.stripe_customer_id,
          last_payment_status = 'converted_to_paid',
          current_period_start = new.current_period_start,
          current_period_end = new.current_period_end,
          updated_at = now()
    where organization_id = new.organization_id
      and tier in ('trial','managed-trial')
      and status <> 'canceled';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_close_managed_trial_on_paid_subscription on public.organization_subscriptions;
create trigger trg_close_managed_trial_on_paid_subscription
after insert or update of status, stripe_subscription_id on public.organization_subscriptions
for each row execute function public.close_managed_trial_on_paid_subscription();

revoke all on function public.close_managed_trial_on_paid_subscription() from public, anon, authenticated;
grant execute on function public.close_managed_trial_on_paid_subscription() to service_role;
