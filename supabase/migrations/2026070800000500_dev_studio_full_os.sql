-- Elevate AI Dev Studio — autonomous operating system tables
-- Wrapped in DO block for safety

DO $$
BEGIN
  -- AI Agents
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

  -- AI Tasks
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

  -- AI Task Steps
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

  -- AI Task Logs
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

  -- AI Memory
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

  -- AI Code Patterns
  CREATE TABLE IF NOT EXISTS public.ai_code_patterns (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type  TEXT NOT NULL,
    description   TEXT NOT NULL,
    pattern_sql   TEXT NOT NULL,
    metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- AI File Snapshots
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

  -- AI Diffs
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

  -- AI Approvals
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

  -- AI Deployments
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

  -- Dev Container Sessions
  CREATE TABLE IF NOT EXISTS public.dev_container_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    container_id    TEXT,
    status          TEXT NOT NULL DEFAULT 'starting'
      CHECK (status IN ('starting', 'ready', 'stopped', 'error')),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Dev Terminal Logs
  CREATE TABLE IF NOT EXISTS public.dev_terminal_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES public.dev_container_sessions(id) ON DELETE CASCADE,
    task_id     UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
    level       TEXT NOT NULL DEFAULT 'info'
      CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_dev_terminal_logs_task ON public.dev_terminal_logs(task_id, created_at DESC);

  -- Dev Audit Logs
  CREATE TABLE IF NOT EXISTS public.dev_audit_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action        TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id   UUID,
    metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_created ON public.dev_audit_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_actor ON public.dev_audit_logs(actor_id, created_at DESC);

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail migration - tables may already exist
  RAISE NOTICE 'Dev Studio tables migration: %', SQLERRM;
END $$;
