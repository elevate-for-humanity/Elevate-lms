-- Workspace provisioning foundation (Elevate Dev Cloud)
-- Reuses tenants + organizations; adds customer_workspaces lifecycle.
-- Does NOT replace is_platform_admin() — uses is_platform_owner_user() for new RLS only.
-- Apply manually in Supabase SQL Editor.

BEGIN;

-- ── 1. Tenant classification ───────────────────────────────────────────────

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS type TEXT;

CREATE INDEX IF NOT EXISTS idx_tenants_is_platform_owner
  ON public.tenants(is_platform_owner)
  WHERE is_platform_owner = true;

CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id
  ON public.tenants(parent_tenant_id)
  WHERE parent_tenant_id IS NOT NULL;

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_type_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_type_check
  CHECK (
    type IS NULL
    OR type IN ('elevate', 'partner_provider', 'employer', 'workforce_agency', 'customer')
  );

CREATE UNIQUE INDEX IF NOT EXISTS tenants_single_platform_owner_idx
  ON public.tenants ((true))
  WHERE is_platform_owner = true;

-- Backfill platform owner tenant (idempotent)
DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT id INTO v_owner_id
  FROM public.tenants
  WHERE is_platform_owner = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id
    FROM public.tenants
    WHERE type = 'elevate'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id
    FROM public.tenants
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_owner_id IS NOT NULL THEN
    UPDATE public.tenants
    SET is_platform_owner = true,
        type = COALESCE(NULLIF(type, ''), 'elevate')
    WHERE id = v_owner_id;

    INSERT INTO public.platform_settings (key, value, updated_at)
    VALUES ('PLATFORM_OWNER_TENANT_ID', v_owner_id::text, now())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = now();
  END IF;
END $$;

-- ── 2. Customer workspaces ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  owner_email TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'builder'
    CHECK (subscription_tier IN ('builder', 'pro', 'agency', 'starter')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'provisioning', 'active', 'suspended', 'failed', 'archived')),
  template_slug TEXT NOT NULL DEFAULT 'workforce-platform-v1',
  github_repo_url TEXT,
  northflank_project_id TEXT,
  northflank_service_id TEXT,
  supabase_project_ref TEXT,
  workspace_url TEXT,
  trial_ends_at TIMESTAMPTZ,
  provision_error TEXT,
  provisioned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provisioned_at TIMESTAMPTZ,
  CONSTRAINT customer_workspaces_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS customer_workspaces_tenant_id_idx
  ON public.customer_workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS customer_workspaces_status_idx
  ON public.customer_workspaces(status);
CREATE INDEX IF NOT EXISTS customer_workspaces_owner_email_idx
  ON public.customer_workspaces(owner_email)
  WHERE owner_email IS NOT NULL;

-- ── 3. Workspace deployments (Northflank / release history) ────────────────

CREATE TABLE IF NOT EXISTS public.workspace_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.customer_workspaces(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'building', 'deploying', 'live', 'failed', 'rolled_back')),
  northflank_build_id TEXT,
  northflank_deployment_id TEXT,
  commit_ref TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deployed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS workspace_deployments_workspace_id_idx
  ON public.workspace_deployments(workspace_id);

-- ── 4. Custom domains ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspace_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.customer_workspaces(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  ssl_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (ssl_status IN ('pending', 'active', 'failed')),
  verification_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_domains_hostname_unique UNIQUE (hostname)
);

CREATE INDEX IF NOT EXISTS workspace_domains_workspace_id_idx
  ON public.workspace_domains(workspace_id);

-- ── 5. AI operator (foundation) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.operator_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.customer_workspaces(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL DEFAULT 'chat'
    CHECK (task_type IN ('chat', 'build', 'test', 'deploy', 'fix', 'generate_site', 'generate_lms')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'canceled')),
  prompt TEXT NOT NULL,
  result_summary TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS operator_tasks_workspace_id_idx
  ON public.operator_tasks(workspace_id);

CREATE TABLE IF NOT EXISTS public.operator_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.customer_workspaces(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'workspace',
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operator_memory_workspace_key_unique UNIQUE (workspace_id, scope, key)
);

-- ── 6. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.customer_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_memory ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_platform_owner_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT id
  FROM public.tenants
  WHERE is_platform_owner = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_owner_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.tenants t ON t.id = p.tenant_id
    WHERE p.id = auth.uid()
      AND t.is_platform_owner = true
      AND p.role IN ('super_admin', 'admin', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.tenants t ON t.id = p.tenant_id
    WHERE p.id = auth.uid()
      AND t.is_platform_owner = true
      AND p.role = 'super_admin'
  );
$$;

-- Customer workspace: platform staff read/write; tenant members read own
DROP POLICY IF EXISTS "customer_workspaces_platform_staff" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_platform_staff" ON public.customer_workspaces
  FOR ALL
  USING (public.is_platform_owner_user())
  WITH CHECK (public.is_platform_owner_user());

DROP POLICY IF EXISTS "customer_workspaces_tenant_read" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_tenant_read" ON public.customer_workspaces
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "customer_workspaces_service_role" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_service_role" ON public.customer_workspaces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "workspace_deployments_service_role" ON public.workspace_deployments;
CREATE POLICY "workspace_deployments_service_role" ON public.workspace_deployments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "workspace_domains_service_role" ON public.workspace_domains;
CREATE POLICY "workspace_domains_service_role" ON public.workspace_domains
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "operator_tasks_service_role" ON public.operator_tasks;
CREATE POLICY "operator_tasks_service_role" ON public.operator_tasks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "operator_memory_service_role" ON public.operator_memory;
CREATE POLICY "operator_memory_service_role" ON public.operator_memory
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.customer_workspaces TO authenticated;
GRANT ALL ON public.customer_workspaces TO service_role;
GRANT ALL ON public.workspace_deployments TO service_role;
GRANT ALL ON public.workspace_domains TO service_role;
GRANT ALL ON public.operator_tasks TO service_role;
GRANT ALL ON public.operator_memory TO service_role;

COMMIT;
