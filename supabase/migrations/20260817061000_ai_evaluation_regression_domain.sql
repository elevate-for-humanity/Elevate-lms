-- AI evaluation and runtime trace domains are intentionally separate.
-- Regression tables are written by trusted CI/service-role processes only.

create table if not exists public.ai_eval_runs (
  id uuid primary key default gen_random_uuid(),
  suite text not null,
  git_sha text,
  branch text,
  trigger text,
  status text not null default 'running' check (status in ('running', 'passed', 'failed', 'cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.ai_eval_cases (
  id text primary key,
  suite text not null,
  category text not null,
  prompt text not null,
  expected_criteria jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_eval_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_eval_runs(id) on delete cascade,
  case_id text references public.ai_eval_cases(id) on delete set null,
  case_key text not null,
  passed boolean not null,
  score numeric,
  p0_contract_passed boolean,
  p1_workflow_passed boolean,
  p2_security_passed boolean,
  p3_quality_passed boolean,
  p4_regression_passed boolean,
  provider text,
  model text,
  latency_ms integer,
  output_text text,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, case_key)
);

create table if not exists public.ai_eval_baselines (
  id uuid primary key default gen_random_uuid(),
  suite text not null,
  case_key text not null,
  version integer not null check (version > 0),
  minimum_score numeric,
  expected jsonb not null default '{}'::jsonb,
  approved_by uuid,
  approved_at timestamptz not null default now(),
  active boolean not null default true,
  unique (suite, case_key, version)
);

create table if not exists public.ai_eval_failures (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.ai_eval_results(id) on delete cascade,
  priority text not null check (priority in ('P0', 'P1', 'P2', 'P3', 'P4')),
  code text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_traces (
  id uuid primary key default gen_random_uuid(),
  trace_id text not null unique,
  workflow text not null,
  provider text,
  model text,
  status text not null check (status in ('started', 'succeeded', 'failed')),
  duration_ms integer,
  request jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  error jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_eval_runs_suite_started_idx
  on public.ai_eval_runs (suite, started_at desc);
create index if not exists ai_eval_results_run_idx
  on public.ai_eval_results (run_id);
create index if not exists ai_eval_results_case_idx
  on public.ai_eval_results (case_key, created_at desc);
create index if not exists ai_eval_failures_result_idx
  on public.ai_eval_failures (result_id, priority);
create index if not exists ai_traces_workflow_created_idx
  on public.ai_traces (workflow, created_at desc);

alter table public.ai_eval_runs enable row level security;
alter table public.ai_eval_cases enable row level security;
alter table public.ai_eval_results enable row level security;
alter table public.ai_eval_baselines enable row level security;
alter table public.ai_eval_failures enable row level security;
alter table public.ai_traces enable row level security;

-- Deliberately no browser/client policies. Trusted server/service-role processes bypass RLS.
comment on table public.ai_eval_runs is 'One CI or manual AI regression execution.';
comment on table public.ai_eval_cases is 'Canonical versioned AI regression cases.';
comment on table public.ai_eval_results is 'Per-case regression outcomes for a run.';
comment on table public.ai_eval_baselines is 'Approved regression thresholds/reference expectations.';
comment on table public.ai_eval_failures is 'Normalized P0-P4 failure evidence associated with a result.';
comment on table public.ai_traces is 'Production/runtime AI execution traces; intentionally separate from CI evaluation data.';
