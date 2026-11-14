-- Migration: 20260728_unified_studio_completion.sql
-- Note: platform_audit_events table already exists in the database
-- This migration adds: status, deleted_at columns to media_assets, cfd_projects, and platform_evaluation_runs tables

begin;

-- ============================================================
-- MEDIA ASSET HARDENING
-- (metadata, updated_at already exist - add status and deleted_at)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'media_assets' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.media_assets ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'media_assets' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.media_assets ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'media_assets' 
    AND indexname = 'media_assets_org_status_created_idx'
  ) THEN
    CREATE INDEX media_assets_org_status_created_idx ON public.media_assets (org_id, status, created_at desc);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'media_assets' 
    AND indexname = 'media_assets_org_storage_path_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX media_assets_org_storage_path_unique_idx ON public.media_assets (org_id, storage_path) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- ============================================================
-- CFD PROJECTS
-- ============================================================

create table if not exists public.cfd_projects (
  id uuid primary key default gen_random_uuid(),


  organization_id uuid not null,
  created_by uuid not null,


  name text not null,
  description text,


  solver text not null default 'openfoam'
    check (solver in ('openfoam')),


  status text not null default 'draft'
    check (
      status in (
        'draft',
        'validating',
        'ready',
        'queued',
        'running',
        'completed',
        'failed',
        'cancelled'
      )
    ),


  configuration jsonb not null default '{}'::jsonb,


  input_media_asset_ids uuid[] not null default '{}',
  output_media_asset_ids uuid[] not null default '{}',


  container_job_id text,
  failure_message text,


  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);


create index if not exists
  cfd_projects_org_created_idx
on public.cfd_projects (
  organization_id,
  created_at desc
);


create index if not exists
  cfd_projects_org_status_idx
on public.cfd_projects (
  organization_id,
  status
);


alter table public.cfd_projects enable row level security;


drop policy if exists
  "cfd service role full access"
on public.cfd_projects;


create policy
  "cfd service role full access"
on public.cfd_projects
for all
to service_role
using (true)
with check (true);


-- ============================================================
-- EVALUATION RUN AUDIT SUPPORT
-- ============================================================


create table if not exists public.platform_evaluation_runs (
  id uuid primary key default gen_random_uuid(),


  organization_id uuid not null,
  created_by uuid not null,


  evaluation_type text not null
    check (
      evaluation_type in (
        'ai-response',
        'course-quality',
        'content-quality',
        'accessibility',
        'route',
        'workflow',
        'security'
      )
    ),


  resource_type text not null,
  resource_id text not null,


  status text not null default 'queued'
    check (
      status in (
        'queued',
        'running',
        'passed',
        'failed',
        'error',
        'cancelled'
      )
    ),


  score numeric(5,2),
  findings jsonb not null default '[]'::jsonb,
  error_message text,


  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);


create index if not exists
  platform_evaluation_runs_org_created_idx
on public.platform_evaluation_runs (
  organization_id,
  created_at desc
);


alter table public.platform_evaluation_runs enable row level security;


drop policy if exists
  "evaluation service role full access"
on public.platform_evaluation_runs;


create policy
  "evaluation service role full access"
on public.platform_evaluation_runs
for all
to service_role
using (true)
with check (true);


commit;
