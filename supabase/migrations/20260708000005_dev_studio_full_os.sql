-- Elevate AI Dev Studio — autonomous operating system tables
-- Idempotent. Apply manually in Supabase Dashboard SQL Editor.

-- ─── ai_agents ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  capabilities  JSONB NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'busy', 'offline', 'error')),
  model_hint    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ai_tasks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN (
      'queued', 'planning', 'running', 'awaiting_approval',
      'completed', 'failed', 'cancelled', 'rolled_back'
    )),
  priority        INTEGER NOT NULL DEFAULT 0,
  agent_id        UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  requested_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trace_id        TEXT,
  plan_json       JSONB NOT NULL DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_reason TEXT,
  risk_tags       TEXT[] NOT NULL DEFAULT '{}',
  result_json     JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON public.ai_tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_agent ON public.ai_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_trace ON public.ai_tasks(trace_id) WHERE trace_id IS NOT NULL;

-- ─── ai_task_steps ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_task_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
  step_order    INTEGER NOT NULL DEFAULT 0,
  name          TEXT NOT NULL,
  action_type   TEXT NOT NULL DEFAULT 'execute',
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'awaiting_approval')),
  input_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_task_steps_task ON public.ai_task_steps(task_id, step_order);

-- ─── ai_task_logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_task_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
  step_id     UUID REFERENCES public.ai_task_steps(id) ON DELETE SET NULL,
  level       TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message     TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_task_logs_task ON public.ai_task_logs(task_id, created_at DESC);

-- ─── ai_memory ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope         TEXT NOT NULL DEFAULT 'platform'
    CHECK (scope IN ('platform', 'agent', 'task', 'repo')),
  agent_id      UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  task_id       UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  key           TEXT NOT NULL,
  content       TEXT NOT NULL,
  embedding_ref TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_memory_scope_key
  ON public.ai_memory(scope, key, COALESCE(agent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ─── ai_code_patterns ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_code_patterns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'general',
  pattern_md    TEXT NOT NULL,
  example_paths TEXT[] NOT NULL DEFAULT '{}',
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ai_repo_index ───────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_repo_index' AND table_schema = 'public') THEN
    -- Table exists - add missing columns with exception handling
    BEGIN
      ALTER TABLE public.ai_repo_index ADD COLUMN IF NOT EXISTS repo_path TEXT NOT NULL DEFAULT '';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ai_repo_index ADD COLUMN IF NOT EXISTS file_hash TEXT;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ai_repo_index ADD COLUMN IF NOT EXISTS language TEXT;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ai_repo_index ADD COLUMN IF NOT EXISTS symbols JSONB NOT NULL DEFAULT '[]'::jsonb;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ai_repo_index ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ai_repo_index ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.ai_repo_index ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    -- Migrate file_path to repo_path if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_repo_index' AND column_name = 'file_path') THEN
      UPDATE public.ai_repo_index SET repo_path = file_path WHERE repo_path IS NULL OR repo_path = '';
      ALTER TABLE public.ai_repo_index DROP COLUMN IF EXISTS file_path;
    END IF;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_repo_index_path ON public.ai_repo_index(repo_path);
  ELSE
    -- Table does not exist - create it
    CREATE TABLE IF NOT EXISTS public.ai_repo_index (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      repo_path TEXT NOT NULL,
      file_hash TEXT,
      language TEXT,
      symbols JSONB NOT NULL DEFAULT '[]'::jsonb,
      last_indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_repo_index_path ON public.ai_repo_index(repo_path);
  END IF;
END $$;

-- ─── ai_file_snapshots ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_file_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  repo_path     TEXT NOT NULL,
  content_hash  TEXT,
  content       TEXT,
  snapshot_type TEXT NOT NULL DEFAULT 'before'
    CHECK (snapshot_type IN ('before', 'after', 'checkpoint')),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_file_snapshots_task ON public.ai_file_snapshots(task_id, created_at DESC);

-- ─── ai_diffs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_diffs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
  repo_path     TEXT NOT NULL,
  diff_text     TEXT NOT NULL,
  lines_added   INTEGER NOT NULL DEFAULT 0,
  lines_removed INTEGER NOT NULL DEFAULT 0,
  applied       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_diffs_task ON public.ai_diffs(task_id, created_at DESC);

-- ─── ai_approvals ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
  step_id       UUID REFERENCES public.ai_task_steps(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason        TEXT,
  risk_tags     TEXT[] NOT NULL DEFAULT '{}',
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_approvals_task ON public.ai_approvals(task_id, status);

-- ─── ai_deployments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_deployments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  service_name    TEXT NOT NULL,
  environment     TEXT NOT NULL DEFAULT 'production',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'building', 'deploying', 'success', 'failed', 'rolled_back')),
  git_sha         TEXT,
  build_id        TEXT,
  health_status   TEXT,
  health_url      TEXT,
  log_summary     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_deployments_status ON public.ai_deployments(status, created_at DESC);

-- ─── dev_container_sessions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_container_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'stopped', 'error')),
  container_ref TEXT,
  workspace     TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ
);

-- ─── dev_terminal_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_terminal_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES public.dev_container_sessions(id) ON DELETE SET NULL,
  task_id       UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  stream        TEXT NOT NULL DEFAULT 'stdout',
  line          TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_terminal_logs_task ON public.dev_terminal_logs(task_id, created_at DESC);

-- ─── dev_audit_logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  trace_id      TEXT,
  ip_address    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_created ON public.dev_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_actor ON public.dev_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_resource ON public.dev_audit_logs(resource_type, resource_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Only enable RLS on tables that exist and don't already have it enabled
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ai_agents','ai_tasks','ai_task_steps','ai_task_logs','ai_memory',
    'ai_code_patterns','ai_repo_index','ai_file_snapshots','ai_diffs',
    'ai_approvals','ai_deployments','dev_container_sessions','dev_terminal_logs','dev_audit_logs'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- service_role full access (conditional)
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ai_agents','ai_tasks','ai_task_steps','ai_task_logs','ai_memory',
    'ai_code_patterns','ai_repo_index','ai_file_snapshots','ai_diffs',
    'ai_approvals','ai_deployments','dev_container_sessions','dev_terminal_logs','dev_audit_logs'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('DROP POLICY IF EXISTS dev_studio_service_role_%s ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY dev_studio_service_role_%s ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- admin / super_admin read+write
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ai_agents','ai_tasks','ai_task_steps','ai_task_logs','ai_memory',
    'ai_code_patterns','ai_repo_index','ai_file_snapshots','ai_diffs',
    'ai_approvals','ai_deployments','dev_container_sessions','dev_terminal_logs','dev_audit_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS dev_studio_admin_%s ON public.%I', t, t);
    EXECUTE format(
      $p$
      CREATE POLICY dev_studio_admin_%s ON public.%I
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
          )
        )
      $p$, t, t
    );
  END LOOP;
END $$;

-- ─── Seed agents ─────────────────────────────────────────────────────────────
INSERT INTO public.ai_agents (slug, name, description, capabilities, status)
VALUES
  ('ai-developer', 'AI Developer', 'Implements features and fixes across the monorepo.',
    '["code","refactor","api","components"]'::jsonb, 'idle'),
  ('ai-debugger', 'AI Debugger', 'Investigates failures, logs, and regressions.',
    '["debug","logs","reproduce","patch"]'::jsonb, 'idle'),
  ('ai-architect', 'AI Architect', 'Designs schemas, boundaries, and system contracts.',
    '["architecture","migrations","rls","design"]'::jsonb, 'idle'),
  ('ai-qa-tester', 'AI QA Tester', 'Runs tests, accessibility scans, and smoke flows.',
    '["test","e2e","a11y","qa"]'::jsonb, 'idle'),
  ('ai-devops', 'AI DevOps Engineer', 'Build, deploy, and infrastructure operations.',
    '["build","deploy","northflank","ci"]'::jsonb, 'idle'),
  ('ai-lms-builder', 'AI LMS Builder', 'Course blueprints, curriculum, and LMS wiring.',
    '["lms","curriculum","blueprint","seed"]'::jsonb, 'idle'),
  ('ai-workflow-builder', 'AI Workflow Builder', 'Automation workflows and cron jobs.',
    '["workflow","cron","automation"]'::jsonb, 'idle'),
  ('ai-website-manager', 'AI Website Manager', 'Marketing pages, nav, and public site health.',
    '["website","nav","seo","content"]'::jsonb, 'idle'),
  ('ai-compliance', 'AI Compliance Assistant', 'ETPL, WIOA, accessibility, and audit gates.',
    '["compliance","etpl","wioa","a11y"]'::jsonb, 'idle'),
  ('ai-biz-ops', 'AI Business Operations Manager', 'Billing, enrollments, and operational tasks.',
    '["billing","enrollment","ops","reports"]'::jsonb, 'idle')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  capabilities = EXCLUDED.capabilities,
  updated_at = now();

-- ─── Seed coding patterns ────────────────────────────────────────────────────
INSERT INTO public.ai_code_patterns (slug, title, category, pattern_md, example_paths)
VALUES
  ('auth-guards', 'Auth guards', 'security',
    'Use apiAuthGuard / apiRequireAdmin / apiRequireDevStudio before any data access. Page routes use requireUser or requireRole.',
    ARRAY['lib/admin/guards.ts', 'lib/devstudio/api-auth.ts']),
  ('devstudio-api-guards', 'Dev Studio API guards', 'security',
    'All /api/devstudio routes must call apiRequireDevStudio and applyRateLimit.',
    ARRAY['apps/admin/app/api/devstudio/']),
  ('supabase-admin-client', 'Supabase admin client usage', 'database',
    'Use requireAdminClient() from @/lib/supabase/admin for service-role writes. Never expose service key to client.',
    ARRAY['lib/supabase/admin.ts']),
  ('tenant-scoping', 'tenant_id scoping', 'multi-tenant',
    'Scope provider data with tenant_id and RLS helpers: get_my_tenant_id(), is_provider_admin().',
    ARRAY['lib/platform/']),
  ('trace-id', 'trace_id propagation', 'observability',
    'Generate trace_id per task/request; pass through logs, audit, and ai_task_logs metadata.',
    ARRAY['lib/devstudio/os/']),
  ('logger-errors', 'logger error handling', 'observability',
    'Use logger from @/lib/logger. API errors via safeError/safeInternalError — never leak error.message.',
    ARRAY['lib/logger.ts', 'lib/api/safe-error.ts']),
  ('workflow-execution', 'workflow execution pattern', 'automation',
    'Persist workflow runs; emit platform events; guard mutations with audit.',
    ARRAY['app/api/cron/', 'lib/platform/events.ts']),
  ('lms-course-generation', 'LMS course generation pattern', 'lms',
    'CredentialBlueprint → buildCanonicalCourseFromBlueprint → courses/course_modules/course_lessons.',
    ARRAY['lib/curriculum/', 'docs/COURSE_ENGINE.md'])
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  pattern_md = EXCLUDED.pattern_md,
  example_paths = EXCLUDED.example_paths,
  updated_at = now();
