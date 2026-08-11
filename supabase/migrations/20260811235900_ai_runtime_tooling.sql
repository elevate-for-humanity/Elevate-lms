-- Canonical AI execution/runtime reconciliation.
-- Additive and idempotent: repairs environments that have older ai_tasks /
-- Dev Studio table shapes without destroying legacy rows.

create extension if not exists pgcrypto;

create table if not exists public.ai_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- ai_tasks keeps the original UUID agent_id foreign key. The runtime agent
-- persona (PARIS/ELLIE/LIZZY/ZORA) is stored separately in agent_type.
alter table public.ai_tasks add column if not exists task_id text;
alter table public.ai_tasks add column if not exists agent_type text;
alter table public.ai_tasks add column if not exists intent text;
alter table public.ai_tasks add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ai_tasks add column if not exists attempts integer default 0;
alter table public.ai_tasks add column if not exists max_attempts integer default 3;
alter table public.ai_tasks add column if not exists timeout_ms integer default 300000;
alter table public.ai_tasks add column if not exists correlation_id text;
alter table public.ai_tasks add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.ai_tasks add column if not exists requested_by uuid;
alter table public.ai_tasks add column if not exists tenant_id uuid;
alter table public.ai_tasks add column if not exists command text;
alter table public.ai_tasks add column if not exists tool_name text;
alter table public.ai_tasks add column if not exists tool_input jsonb;
alter table public.ai_tasks add column if not exists tool_output jsonb;
alter table public.ai_tasks add column if not exists approval_status text;
alter table public.ai_tasks add column if not exists quality_score numeric(5,2);
alter table public.ai_tasks add column if not exists result_json jsonb;
alter table public.ai_tasks add column if not exists error_message text;
alter table public.ai_tasks add column if not exists started_at timestamptz;
alter table public.ai_tasks add column if not exists completed_at timestamptz;
alter table public.ai_tasks add column if not exists updated_at timestamptz default now();
alter table public.ai_tasks add column if not exists plan_json jsonb;
alter table public.ai_tasks add column if not exists requires_approval boolean default false;
alter table public.ai_tasks add column if not exists risk_tags text[] default '{}'::text[];

create index if not exists ai_tasks_task_id_reconciled_idx on public.ai_tasks(task_id);
create index if not exists ai_tasks_agent_type_reconciled_idx on public.ai_tasks(agent_type);
create index if not exists ai_tasks_status_reconciled_idx on public.ai_tasks(status);
create index if not exists ai_tasks_correlation_reconciled_idx on public.ai_tasks(correlation_id);
create index if not exists ai_tasks_tool_name_idx on public.ai_tasks(tool_name);
create index if not exists ai_tasks_requested_by_idx on public.ai_tasks(requested_by);

-- Dev Studio originally used action/output text columns while the newer task
-- runner expects structured step fields. Preserve both shapes and backfill the
-- structured columns from legacy values where possible.
alter table public.ai_task_steps add column if not exists name text;
alter table public.ai_task_steps add column if not exists action_type text;
alter table public.ai_task_steps add column if not exists input_json jsonb not null default '{}'::jsonb;
alter table public.ai_task_steps add column if not exists output_json jsonb;
alter table public.ai_task_steps add column if not exists error_message text;
update public.ai_task_steps
set name = coalesce(name, action, 'Task step'),
    action_type = coalesce(action_type, action, 'execute')
where name is null or action_type is null;

-- Approval compatibility for the newer Dev Studio UI/runtime.
alter table public.ai_approvals add column if not exists risk_tags text[] not null default '{}'::text[];
alter table public.ai_approvals add column if not exists reviewed_by uuid;
alter table public.ai_approvals add column if not exists reviewed_at timestamptz;
update public.ai_approvals
set reviewed_by = coalesce(reviewed_by, approved_by),
    reviewed_at = coalesce(reviewed_at, decided_at)
where approved_by is not null or decided_at is not null;

create table if not exists public.ai_tool_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.ai_tasks(id) on delete set null,
  actor_id uuid,
  actor_role text,
  tenant_id uuid,
  agent_id text not null,
  tool_name text not null,
  classification text not null check (classification in ('read', 'write')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  requires_approval boolean not null default false,
  approval_required boolean not null default false,
  approval_status text not null default 'not_required',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status text not null default 'started',
  idempotency_key text,
  correlation_id text,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Existing environments may have the first-generation tool-run table.
alter table public.ai_tool_runs add column if not exists task_id uuid;
alter table public.ai_tool_runs add column if not exists actor_role text;
alter table public.ai_tool_runs add column if not exists agent_id text;
alter table public.ai_tool_runs add column if not exists classification text;
alter table public.ai_tool_runs add column if not exists approval_required boolean not null default false;
alter table public.ai_tool_runs add column if not exists correlation_id text;

-- Reconcile historical CHECK constraints with the production executor states.
alter table public.ai_tool_runs drop constraint if exists ai_tool_runs_status_check;
alter table public.ai_tool_runs add constraint ai_tool_runs_status_check
  check (status in ('queued','running','pending_approval','started','approval_required','completed','failed','blocked'));
alter table public.ai_tool_runs drop constraint if exists ai_tool_runs_approval_status_check;
alter table public.ai_tool_runs add constraint ai_tool_runs_approval_status_check
  check (approval_status in ('not_required','pending','approved','denied','rejected'));

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
alter table public.ai_task_steps enable row level security;
alter table public.ai_approvals enable row level security;
alter table public.ai_tool_runs enable row level security;

comment on table public.ai_tool_runs is
  'Durable trace of every registered AI tool execution, approval decision, result, and error.';
comment on column public.ai_tool_runs.output is
  'Tool result payload only. Never persist chain-of-thought or hidden reasoning.';
