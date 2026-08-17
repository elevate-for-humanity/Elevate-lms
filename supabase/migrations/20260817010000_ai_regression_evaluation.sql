-- Internal AI regression evaluation schema.
-- Reuses existing ai_gateway_logs for runtime traces instead of creating a duplicate ai_traces table.

create table if not exists public.ai_eval_cases (
  id text primary key,
  category text not null,
  suite text not null default 'core',
  user_input_prompt text not null,
  expected_criteria jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_eval_runs (
  id uuid primary key default gen_random_uuid(),
  suite text not null default 'core',
  status text not null check (status in ('running','passed','failed','error')),
  git_sha text,
  git_ref text,
  provider text,
  model text,
  quality_threshold numeric(4,2) not null default 4.00,
  average_quality_score numeric(4,2),
  total_cases integer not null default 0,
  passed_cases integer not null default 0,
  failed_cases integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ai_eval_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_eval_runs(id) on delete cascade,
  case_id text not null,
  category text not null,
  deterministic_passed boolean not null,
  workflow_passed boolean not null default true,
  security_passed boolean not null default true,
  quality_score numeric(4,2),
  passed boolean not null,
  latency_ms integer,
  provider text,
  model text,
  assertions jsonb not null default '[]'::jsonb,
  judge jsonb,
  output_excerpt text,
  error_message text,
  created_at timestamptz not null default now(),
  unique (run_id, case_id)
);

create table if not exists public.ai_eval_baselines (
  id uuid primary key default gen_random_uuid(),
  suite text not null,
  case_id text not null,
  quality_score numeric(4,2) not null,
  git_sha text,
  approved_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (suite, case_id)
);

create index if not exists ai_eval_runs_suite_created_idx
  on public.ai_eval_runs (suite, started_at desc);
create index if not exists ai_eval_results_run_idx
  on public.ai_eval_results (run_id);
create index if not exists ai_eval_results_case_idx
  on public.ai_eval_results (case_id, created_at desc);
create index if not exists ai_eval_baselines_suite_idx
  on public.ai_eval_baselines (suite, case_id);

alter table public.ai_eval_cases enable row level security;
alter table public.ai_eval_runs enable row level security;
alter table public.ai_eval_results enable row level security;
alter table public.ai_eval_baselines enable row level security;

comment on table public.ai_eval_cases is 'Canonical internal AI regression test definitions. Service-role managed.';
comment on table public.ai_eval_runs is 'One CI or manual AI evaluation execution.';
comment on table public.ai_eval_results is 'Per-case deterministic, workflow, security, and LLM-judge results.';
comment on table public.ai_eval_baselines is 'Approved quality baselines for regression comparison.';
