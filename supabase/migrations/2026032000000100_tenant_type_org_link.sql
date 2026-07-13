-- =============================================================================
-- Phase 1.1: Tenant type classification + organizations → tenants FK
--
-- Adds:
--   1. tenants.type enum: elevate | partner_provider | employer | workforce_agency
--   2. organizations.tenant_id FK → tenants
--   3. Backfill: existing Elevate tenant gets type='elevate'
--   4. Constraint: organizations of type 'training_provider' must have tenant_id
-- =============================================================================

BEGIN;

-- 1. Add type column to tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'elevate'
  CHECK (type IN ('elevate', 'partner_provider', 'employer', 'workforce_agency'));

-- 2. Add tenant_id FK to organizations (nullable — backfill before constraining)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON public.organizations(tenant_id);

-- 3. Backfill: link existing Elevate-operated organizations to the primary tenant
--    Assumes the first/oldest tenant is the Elevate operator tenant.
--    Safe: only updates rows where tenant_id is currently NULL.
DO $$
DECLARE
  v_elevate_tenant_id UUID;
BEGIN
  SELECT id INTO v_elevate_tenant_id
  FROM public.tenants
  WHERE type = 'elevate'
  ORDER BY created_at ASC
  LIMIT 1;

  -- If no elevate tenant exists yet, use the oldest tenant and mark it elevate
  IF v_elevate_tenant_id IS NULL THEN
    SELECT id INTO v_elevate_tenant_id
    FROM public.tenants
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_elevate_tenant_id IS NOT NULL THEN
      UPDATE public.tenants SET type = 'elevate' WHERE id = v_elevate_tenant_id;
    END IF;
  END IF;

  -- Link unlinked organizations to the Elevate tenant
  IF v_elevate_tenant_id IS NOT NULL THEN
    UPDATE public.organizations
    SET tenant_id = v_elevate_tenant_id
    WHERE tenant_id IS NULL;
  END IF;
END $$;

-- 4. Add a check function: provider-type organizations must have a tenant
--    Implemented as a trigger rather than a CHECK constraint so it can
--    reference another table safely.
CREATE OR REPLACE FUNCTION public.enforce_provider_org_tenant()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = 'training_provider' AND NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Organizations of type training_provider must have a tenant_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_provider_org_tenant ON public.organizations;
CREATE TRIGGER trg_enforce_provider_org_tenant
  BEFORE INSERT OR UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_provider_org_tenant();

-- 5. RLS: tenants table — admins can manage all; providers can read their own
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_admin_all" ON public.tenants;
CREATE POLICY "tenants_admin_all" ON public.tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "tenants_provider_read_own" ON public.tenants;
CREATE POLICY "tenants_provider_read_own" ON public.tenants
  FOR SELECT USING (
    id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 6. RLS: organizations — scoped by tenant_id
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_admin_all" ON public.organizations;
CREATE POLICY "organizations_admin_all" ON public.organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "organizations_tenant_read" ON public.organizations;
CREATE POLICY "organizations_tenant_read" ON public.organizations
  FOR SELECT USING (
    tenant_id = (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

GRANT SELECT ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;

COMMIT;
