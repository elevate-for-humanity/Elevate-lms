-- Dev Studio schema reconciliation
-- Fixes chronological mismatch between 20260708000001 and 20260708000005.
-- If 000001 ran first, tables exist with the older/simpler column set.
-- This migration adds every column the code references that may be missing.
-- Also creates platform_secrets which was never included in any migration.
-- Idempotent — safe to re-run.

-- ─── platform_secrets (missing from all prior migrations) ────────────────────
CREATE TABLE IF NOT EXISTS public.platform_secrets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT NOT NULL UNIQUE,
  value_enc     TEXT NOT NULL DEFAULT '',
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'general',
  is_sensitive  BOOLEAN NOT NULL DEFAULT true,
  last_tested   TIMESTAMPTZ,
  test_status   TEXT,
  updated_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on platform_secrets" ON public.platform_secrets;
CREATE POLICY "Service role full access on platform_secrets" ON public.platform_secrets
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_platform_secrets_category ON public.platform_secrets (category);
CREATE INDEX IF NOT EXISTS idx_platform_secrets_key ON public.platform_secrets (key);

COMMENT ON TABLE public.platform_secrets IS
  'Runtime secrets managed via Admin Dev Studio Secrets panel. '
  'Precedence: platform_secrets > app_secrets > process.env.';

-- ─── ai_agents: add columns from 000005 schema ──────────────────────────────
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS model_hint TEXT;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill slug from name for existing rows (slug is UNIQUE in 000005)
UPDATE public.ai_agents
SET slug = lower(replace(replace(name, ' ', '-'), '_', '-'))
WHERE slug IS NULL;

-- Make slug NOT NULL + UNIQUE only if not already constrained
DO $$ BEGIN
  ALTER TABLE public.ai_agents ALTER COLUMN slug SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ai_agents ADD CONSTRAINT ai_agents_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- 000001 has 'role' and 'config' columns not in 000005;
-- keep them for backward compat, they don't hurt.

-- ─── ai_tasks: add columns from 000005 schema ───────────────────────────────
ALTER TABLE public.ai_tasks ADD COLUMN IF NOT EXISTS requested_by UUID;
ALTER TABLE public.ai_tasks ADD COLUMN IF NOT EXISTS trace_id TEXT;
ALTER TABLE public.ai_tasks ADD COLUMN IF NOT EXISTS plan_json JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.ai_tasks ADD COLUMN IF NOT EXISTS risk_tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.ai_tasks ADD COLUMN IF NOT EXISTS result_json JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.ai_tasks ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.ai_tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.ai_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 000001 uses 'priority' as text, 000005 uses integer. Keep as-is; code casts.
-- 000001 has 'plan' jsonb and 'result' jsonb — keep for backward compat.

-- ─── ai_deployments: add columns from 000005 schema ─────────────────────────
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS task_id UUID;
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS git_sha TEXT;
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS build_id TEXT;
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS health_status TEXT;
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS health_url TEXT;
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS log_summary TEXT;
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.ai_deployments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill service_name from service for existing rows
UPDATE public.ai_deployments
SET service_name = service
WHERE service_name IS NULL AND service IS NOT NULL;

-- ─── ai_memory: add columns from 000005 schema ──────────────────────────────
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'platform';
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS task_id UUID;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS embedding_ref TEXT;
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill content from value for existing rows (000001 has 'value', 000005 has 'content')
UPDATE public.ai_memory
SET content = value
WHERE content IS NULL AND value IS NOT NULL;

-- ─── dev_audit_logs: add columns from 000005 schema ─────────────────────────
-- 000001 has 'user_id', 000005 has 'actor_id'. Code uses both:
--   builds/route.ts inserts user_id, audit.ts inserts actor_id.
-- Add both columns so neither code path breaks.
ALTER TABLE public.dev_audit_logs ADD COLUMN IF NOT EXISTS actor_id UUID;
ALTER TABLE public.dev_audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.dev_audit_logs ADD COLUMN IF NOT EXISTS trace_id TEXT;
ALTER TABLE public.dev_audit_logs ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE public.dev_audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Backfill: copy between actor_id ↔ user_id so both columns are populated
UPDATE public.dev_audit_logs
SET actor_id = user_id
WHERE actor_id IS NULL AND user_id IS NOT NULL;

UPDATE public.dev_audit_logs
SET user_id = actor_id
WHERE user_id IS NULL AND actor_id IS NOT NULL;

-- ─── Ensure RLS is enabled on all dev-studio tables ─────────────────────────
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_audit_logs ENABLE ROW LEVEL SECURITY;

-- Service-role policies for all dev-studio tables
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'ai_agents', 'ai_tasks', 'ai_memory', 'ai_deployments',
    'dev_audit_logs', 'platform_secrets'
  ]) LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Service role full access" ON public.%I; '
      'CREATE POLICY "Service role full access" ON public.%I FOR ALL USING (auth.role() = ''service_role'');',
      t, t
    );
  END LOOP;
END $$;
