-- Migration: 20260729_platform_jobs_and_health.sql
-- Platform jobs, health snapshots, and evaluation definitions

begin;

-- ============================================================
-- PLATFORM JOBS
-- ============================================================

create table if not exists public.platform_jobs (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null,

  job_type text not null
    check (job_type in (
      'deployment',
      'container',
      'cfd_simulation',
      'evaluation',
      'content_generation',
      'backup',
      'sync',
      'cleanup',
      'custom'
    )),

  status text not null default 'queued'
    check (status in (
      'draft',
      'queued',
      'running',
      'verifying',
      'succeeded',
      'failed',
      'cancelled'
    )),

  priority integer not null default 5
    check (priority between 1 and 10),

  payload jsonb not null default '{}'::jsonb,

  result jsonb,

  error_message text,

  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_jobs_org_status_idx
on public.platform_jobs (organization_id, status);

create index if not exists platform_jobs_scheduled_at_idx
on public.platform_jobs (scheduled_at)
where status = 'queued';

create index if not exists platform_jobs_type_status_idx
on public.platform_jobs (job_type, status);

alter table public.platform_jobs enable row level security;

drop policy if exists "platform jobs service role full access" on public.platform_jobs;
create policy "platform jobs service role full access"
on public.platform_jobs for all to service_role using (true) with check (true);

-- ============================================================
-- PLATFORM JOB EVENTS
-- ============================================================

create table if not exists public.platform_job_events (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null references platform_jobs(id) on delete cascade,

  event_type text not null
    check (event_type in (
      'created',
      'queued',
      'started',
      'progress',
      'log',
      'completed',
      'failed',
      'cancelled',
      'retry'
    )),

  message text,
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists platform_job_events_job_id_idx
on public.platform_job_events (job_id, created_at);

alter table public.platform_job_events enable row level security;

drop policy if exists "platform job events service role full access" on public.platform_job_events;
create policy "platform job events service role full access"
on public.platform_job_events for all to service_role using (true) with check (true);

-- ============================================================
-- PLATFORM HEALTH SNAPSHOTS
-- ============================================================

create table if not exists public.platform_health_snapshots (
  id uuid primary key default gen_random_uuid(),

  capability text not null,
  status text not null
    check (status in ('healthy', 'degraded', 'unavailable')),

  checks jsonb not null default '[]'::jsonb,

  uptime_percent numeric(5,2),
  response_time_ms integer,
  error_rate_percent numeric(5,2),

  metadata jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists platform_health_snapshots_capability_created_idx
on public.platform_health_snapshots (capability, created_at desc);

create index if not exists platform_health_snapshots_recent_idx
on public.platform_health_snapshots (created_at desc)
where status != 'healthy';

alter table public.platform_health_snapshots enable row level security;

drop policy if exists "platform health snapshots service role full access" on public.platform_health_snapshots;
create policy "platform health snapshots service role full access"
on public.platform_health_snapshots for all to service_role using (true) with check (true);

-- ============================================================
-- PLATFORM EVALUATION DEFINITIONS
-- ============================================================

create table if not exists public.platform_evaluation_definitions (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null,

  evaluation_type text not null
    check (evaluation_type in (
      'ai-response',
      'course-quality',
      'content-quality',
      'accessibility',
      'route',
      'workflow',
      'security',
      'performance',
      'seo'
    )),

  name text not null,
  description text,

  criteria jsonb not null default '[]'::jsonb,

  scoring_method text not null default 'threshold'
    check (scoring_method in ('threshold', 'rubric', 'comparison')),

  thresholds jsonb,

  enabled boolean not null default true,

  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_evaluation_definitions_org_type_idx
on public.platform_evaluation_definitions (organization_id, evaluation_type);

alter table public.platform_evaluation_definitions enable row level security;

drop policy if exists "evaluation definitions service role full access" on public.platform_evaluation_definitions;
create policy "evaluation definitions service role full access"
on public.platform_evaluation_definitions for all to service_role using (true) with check (true);

-- ============================================================
-- MEDIA ASSET REFERENCES
-- ============================================================

create table if not exists public.media_asset_references (
  id uuid primary key default gen_random_uuid(),

  media_asset_id uuid not null references media_assets(id) on delete cascade,

  referenced_by_type text not null,
  referenced_by_id uuid not null,

  reference_context jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists media_asset_references_asset_idx
on public.media_asset_references (media_asset_id);

create index if not exists media_asset_references_target_idx
on public.media_asset_references (referenced_by_type, referenced_by_id);

alter table public.media_asset_references enable row level security;

drop policy if exists "media asset references service role full access" on public.media_asset_references;
create policy "media asset references service role full access"
on public.media_asset_references for all to service_role using (true) with check (true);

-- ============================================================
-- DEPLOYMENT RECORDS
-- ============================================================

create table if not exists public.deployment_records (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null,

  service text not null,
  environment text not null default 'production'
    check (environment in ('development', 'staging', 'production')),

  commit_sha text not null,
  branch text,
  message text,

  status text not null default 'pending'
    check (status in (
      'pending',
      'building',
      'deployed',
      'verified',
      'failed',
      'rolled_back'
    )),

  build_logs text,
  deployment_url text,
  health_check_url text,

  triggered_by uuid not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists deployment_records_org_service_idx
on public.deployment_records (organization_id, service, created_at desc);

create index if not exists deployment_records_sha_idx
on public.deployment_records (commit_sha);

alter table public.deployment_records enable row level security;

drop policy if exists "deployment records service role full access" on public.deployment_records;
create policy "deployment records service role full access"
on public.deployment_records for all to service_role using (true) with check (true);

-- ============================================================
-- DEPLOYMENT EVENTS
-- ============================================================

create table if not exists public.deployment_events (
  id uuid primary key default gen_random_uuid(),

  deployment_id uuid not null references deployment_records(id) on delete cascade,

  event_type text not null
    check (event_type in (
      'triggered',
      'build_started',
      'build_progress',
      'build_completed',
      'deployment_started',
      'health_check',
      'deployment_completed',
      'deployment_failed',
      'rollback_triggered',
      'rollback_completed'
    )),

  message text,
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists deployment_events_deployment_idx
on public.deployment_events (deployment_id, created_at);

alter table public.deployment_events enable row level security;

drop policy if exists "deployment events service role full access" on public.deployment_events;
create policy "deployment events service role full access"
on public.deployment_events for all to service_role using (true) with check (true);

commit;
