-- Durable Course Builder production state shared by specialized workers.
-- The Course Builder is the control plane; worker services remain idempotent executors.

create table if not exists public.course_production_runs (
  id uuid primary key default gen_random_uuid(),
  devstudio_job_id uuid unique references public.devstudio_jobs(id) on delete set null,
  course_id uuid references public.courses(id) on delete cascade,
  storyboard_version integer not null default 1 check (storyboard_version > 0),
  state text not null default 'requested' check (state in (
    'requested','planning','technical_review','storyboard_ready','generating_assets',
    'generating_narration','rendering','quality_review','human_review','approved',
    'published','blocked','retryable_failed','permanent_failed','cancelled'
  )),
  idempotency_key text not null unique,
  request jsonb not null default '{}'::jsonb,
  instructional_plan jsonb,
  storyboard_manifest jsonb,
  quality_report jsonb,
  last_valid_artifact jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.course_production_worker_stages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.course_production_runs(id) on delete cascade,
  worker_kind text not null check (worker_kind in (
    'orchestrator','instructional_llm','technical_verification','storyboard',
    'diagram','image','motion','document','narration','gpu_render','quality_control','publisher'
  )),
  status text not null default 'requested' check (status in (
    'requested','running','completed','blocked','retryable_failed','permanent_failed','cancelled'
  )),
  attempt integer not null default 1 check (attempt > 0),
  input_checksum text,
  output_artifact jsonb,
  evidence jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(run_id, worker_kind, attempt)
);

create index if not exists course_production_runs_course_state_idx
  on public.course_production_runs(course_id, state, updated_at desc);
create index if not exists course_production_worker_stages_run_idx
  on public.course_production_worker_stages(run_id, updated_at desc);

alter table public.course_production_runs enable row level security;
alter table public.course_production_worker_stages enable row level security;
revoke all on public.course_production_runs from anon, authenticated;
revoke all on public.course_production_worker_stages from anon, authenticated;
grant all on public.course_production_runs to service_role;
grant all on public.course_production_worker_stages to service_role;

create or replace function public.record_course_production_stage(
  p_job_id uuid,
  p_course_id uuid,
  p_worker_kind text,
  p_run_state text,
  p_worker_status text,
  p_evidence jsonb default '{}'::jsonb,
  p_error text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_key text := 'course-build:' || p_job_id::text;
begin
  insert into public.course_production_runs(devstudio_job_id, course_id, state, idempotency_key, request, error, updated_at)
  values (p_job_id, p_course_id, p_run_state, v_key, '{}'::jsonb, p_error, now())
  on conflict (idempotency_key) do update set
    course_id = coalesce(excluded.course_id, course_production_runs.course_id),
    state = excluded.state,
    error = excluded.error,
    updated_at = now(),
    completed_at = case when excluded.state in ('approved','published','permanent_failed','cancelled') then now() else null end
  returning id into v_run_id;

  insert into public.course_production_worker_stages(run_id, worker_kind, status, evidence, error, started_at, completed_at, updated_at)
  values (
    v_run_id, p_worker_kind, p_worker_status, coalesce(p_evidence, '{}'::jsonb), p_error,
    case when p_worker_status = 'running' then now() else null end,
    case when p_worker_status = 'completed' then now() else null end,
    now()
  )
  on conflict (run_id, worker_kind, attempt) do update set
    status = excluded.status,
    evidence = course_production_worker_stages.evidence || excluded.evidence,
    error = excluded.error,
    started_at = coalesce(course_production_worker_stages.started_at, excluded.started_at),
    completed_at = excluded.completed_at,
    updated_at = now();
  return v_run_id;
end;
$$;

revoke all on function public.record_course_production_stage(uuid,uuid,text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.record_course_production_stage(uuid,uuid,text,text,text,jsonb,text) to service_role;

comment on table public.course_production_runs is 'Canonical durable Course Builder production state; preserves the last valid artifact across retries.';
comment on table public.course_production_worker_stages is 'Idempotent evidence ledger for specialized instructional, media, narration, render, QC, and publishing workers.';
