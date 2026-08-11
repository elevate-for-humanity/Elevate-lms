-- Canonical AI execution/runtime reconciliation.
-- This migration is deliberately additive so it can repair environments that
-- already created an older ai_tasks shape without destroying legacy data.

create extension if not exists pgcrypto;

create table if not exists public.ai_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.ai_tasks add column if not exists task_id text;
alter table public.ai_tasks add column if not exists agent_type text;
alter table public.ai_tasks add column if not exists agent_id text;
alter table public.ai_tasks add column if not exists intent text;
alter table public.ai_tasks add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ai_tasks add column if not exists priority text;
alter table public.ai_tasks add column if not exists status text;
alter table public.ai_tasks add column if not exists result jsonb;
alter table public.ai_tasks add column if not exists result_json jsonb;
alter table public.ai_tasks add column if not exists error text;
alter table public.ai_tasks add column if not exists attempts integer default 0;
alter table public.ai_tasks add column if not exists max_attempts integer default 3;
alter table public.ai_tasks add column if not exists timeout_ms integer default 300000;
alter table public.ai_tasks add column if not exists started_at timestamptz;
alter table public.ai_tasks add column if not exists completed_at timestamptz;
alter table public.ai_tasks add column if not exists correlation_id text;
alter table public.ai_tasks add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.ai_tasks add column if not exists updated_at timestamptz default now();
alter table public.ai_tasks add column if not exists requested_by uuid;
alter table public.ai_tasks add column if not exists tenant_id uuid;
alter table public.ai_tasks add column if not exists trace_id uuid;
alter table public.ai_tasks add column if not exists command text;
alter table public.ai_tasks add column if not exists plan_json jsonb;
alter table public.ai_tasks add column if not exists requires_approval boolean default false;
alter table public.ai_tasks add column if not exists risk_tags text[] default '{}'::text[];
alter table public.ai_tasks add column if not exists tool_name text;
alter table public.ai_tasks add column if not exists tool_input jsonb;
alter table public.ai_tasks add column if not exists tool_output jsonb;
alter table public.ai_tasks add column if not exists approval_status text;
alter table public.ai_tasks add column if not exists quality_score numeric(5,2);

create index if not exists ai_tasks_task_id_reconciled_idx on public.ai_tasks(task_id);
create index if not exists ai_tasks_agent_id_reconciled_idx on public.ai_tasks(agent_id);
create index if not exists ai_tasks_agent_type_reconciled_idx on public.ai_tasks(agent_type);
create index if not exists ai_tasks_status_reconciled_idx on public.ai_tasks(status);
create index if not exists ai_tasks_correlation_reconciled_idx on public.ai_tasks(correlation_id);
create index if not exists ai_tasks_tool_name_idx on public.ai_tasks(tool_name);
create index if not exists ai_tasks_requested_by_idx on public.ai_tasks(requested_by);

create table if not exists public.ai_tool_runs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  tenant_id uuid,
  agent_id text not null,
  tool_name text not null,
  classification text not null check (classification in ('read', 'write')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  approval_required boolean not null default false,
  approval_status text not null default 'not_required'
    check (approval_status in ('not_required', 'pending', 'approved', 'denied')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status text not null default 'started'
    check (status in ('started', 'approval_required', 'completed', 'failed', 'blocked')),
  idempotency_key text,
  correlation_id text,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_tool_runs_created_at_idx on public.ai_tool_runs(created_at desc);
create index if not exists ai_tool_runs_agent_idx on public.ai_tool_runs(agent_id, created_at desc);
create index if not exists ai_tool_runs_tool_idx on public.ai_tool_runs(tool_name, created_at desc);
create index if not exists ai_tool_runs_actor_idx on public.ai_tool_runs(actor_id, created_at desc);
create index if not exists ai_tool_runs_status_idx on public.ai_tool_runs(status, created_at desc);
create index if not exists ai_tool_runs_correlation_idx on public.ai_tool_runs(correlation_id);
create unique index if not exists ai_tool_runs_idempotency_unique
  on public.ai_tool_runs(idempotency_key)
  where idempotency_key is not null and status = 'completed';

alter table public.ai_tasks enable row level security;
alter table public.ai_tool_runs enable row level security;

comment on table public.ai_tool_runs is
  'Durable trace of every registered AI tool execution, approval decision, result, and error.';
comment on column public.ai_tool_runs.output is
  'Tool result payload only. Do not persist chain-of-thought or hidden reasoning.';
