-- Platform owner tenant model + customer workspace provisioning foundation
-- See docs/platform-owner-tenant-model.md

BEGIN;

-- ── 1. Tenant classification ───────────────────────────────────────────────

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_is_platform_owner
  ON public.tenants(is_platform_owner)
  WHERE is_platform_owner = true;

CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id
  ON public.tenants(parent_tenant_id)
  WHERE parent_tenant_id IS NOT NULL;

-- Extend type enum: customer = Dev Cloud provisioned tenant
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_type_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_type_check
  CHECK (type IN ('elevate', 'partner_provider', 'employer', 'workforce_agency', 'customer'));

-- Exactly one platform owner tenant (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS tenants_single_platform_owner_idx
  ON public.tenants ((true))
  WHERE is_platform_owner = true;

-- ── 2. Backfill platform owner tenant ────────────────────────────────────────

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
        type = CASE WHEN type IS NULL OR type = '' THEN 'elevate' ELSE type END
    WHERE id = v_owner_id;

    -- Platform staff without tenant_id → attach to owner tenant
    UPDATE public.profiles
    SET tenant_id = v_owner_id,
        updated_at = now()
    WHERE tenant_id IS NULL
      AND role IN ('super_admin', 'admin', 'staff');

    INSERT INTO public.platform_settings (key, value, updated_at)
    VALUES (
      'PLATFORM_OWNER_TENANT_ID',
      v_owner_id::text,
      now()
    )
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = now();
  END IF;
END $$;

-- ── 3. Customer workspaces (Dev Cloud provisioning) ──────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'builder'
    CHECK (subscription_tier IN ('builder', 'pro', 'agency')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'provisioning', 'active', 'suspended', 'failed', 'archived')),
  template_slug TEXT NOT NULL DEFAULT 'workforce-platform-v1',
  github_repo_url TEXT,
  northflank_project_id TEXT,
  northflank_service_id TEXT,
  supabase_project_ref TEXT,
  workspace_url TEXT,
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

ALTER TABLE public.customer_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_workspaces_platform_staff" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_platform_staff" ON public.customer_workspaces
  FOR ALL
  USING (public.is_platform_owner_user())
  WITH CHECK (public.is_platform_owner_user());

DROP POLICY IF EXISTS "customer_workspaces_service_role" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_service_role" ON public.customer_workspaces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.customer_workspaces TO authenticated;
GRANT ALL ON public.customer_workspaces TO service_role;

-- ── 4. SQL helpers ───────────────────────────────────────────────────────────

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

CREATE OR REPLACE FUNCTION public.is_platform_owner_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND is_platform_owner = true
  );
$$;

-- Platform staff: admin / super_admin / staff on the platform owner tenant
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

-- Platform operator: super_admin on platform owner tenant (DevStudio, deploy)
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

-- Narrow is_platform_admin to platform owner tenant (break-glass: service_role unchanged)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT public.is_platform_owner_user();
$$;

COMMENT ON FUNCTION public.get_platform_owner_tenant_id IS
  'Returns the single platform owner tenant UUID (Elevate operator).';
COMMENT ON FUNCTION public.is_platform_owner_user IS
  'True when the session user is platform staff (super_admin/admin/staff) on the owner tenant.';
COMMENT ON FUNCTION public.is_platform_operator IS
  'True when the session user is platform owner (super_admin on owner tenant). DevStudio/deploy.';

-- ── 5. Provisioning job type for workspace_provision ───────────────────────

-- provisioning_jobs.job_type is TEXT; no enum alteration required.
-- Application enqueues job_type = 'workspace_provision' (see lib/jobs/queue.ts).

COMMIT;
