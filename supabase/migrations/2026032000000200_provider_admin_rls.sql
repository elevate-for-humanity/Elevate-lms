-- =============================================================================
-- Phase 1.2: provider_admin role — tenant-scoped RLS policies
--
-- provider_admin (hierarchy level 50) can manage resources within their own
-- tenant only. Hard-blocked from cross-tenant reads on all core tables.
--
-- Design: uses profiles.tenant_id subquery (consistent with existing pattern).
-- High-traffic tables are noted for JWT-claim migration in Phase 10.
-- =============================================================================

BEGIN;

-- Helper: get the tenant_id of the current user from profiles.
-- Defined SECURITY DEFINER to bypass RLS on profiles during policy evaluation.
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Helper: check if current user is provider_admin
CREATE OR REPLACE FUNCTION public.is_provider_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'provider_admin'
  );
$$;

-- =============================================================================
-- programs — provider_admin can manage programs in their tenant only
-- =============================================================================
DROP POLICY IF EXISTS "programs_provider_admin_own_tenant" ON public.programs;
CREATE POLICY "programs_provider_admin_own_tenant" ON public.programs
  FOR ALL USING (
    public.is_provider_admin()
    AND tenant_id = public.get_my_tenant_id()
  )
  WITH CHECK (
    public.is_provider_admin()
    AND tenant_id = public.get_my_tenant_id()
  );

-- =============================================================================
-- training_enrollments — provider_admin reads enrollments in their tenant
-- =============================================================================
DROP POLICY IF EXISTS "training_enrollments_provider_admin" ON public.training_enrollments;
CREATE POLICY "training_enrollments_provider_admin" ON public.training_enrollments
  FOR SELECT USING (
    public.is_provider_admin()
    AND tenant_id = public.get_my_tenant_id()
  );

-- =============================================================================
-- program_enrollments — provider_admin reads enrollments in their tenant
-- =============================================================================
DROP POLICY IF EXISTS "program_enrollments_provider_admin" ON public.program_enrollments;
CREATE POLICY "program_enrollments_provider_admin" ON public.program_enrollments
  FOR SELECT USING (
    public.is_provider_admin()
    AND tenant_id = public.get_my_tenant_id()
  );

-- =============================================================================
-- profiles — provider_admin can read profiles of learners in their tenant
--            Cannot read profiles from other tenants.
-- =============================================================================
DROP POLICY IF EXISTS "profiles_provider_admin_own_tenant" ON public.profiles;
CREATE POLICY "profiles_provider_admin_own_tenant" ON public.profiles
  FOR SELECT USING (
    public.is_provider_admin()
    AND tenant_id = public.get_my_tenant_id()
  );

-- =============================================================================
-- learner_credentials — provider_admin reads credentials for their tenant learners
-- =============================================================================
DROP POLICY IF EXISTS "lc_provider_admin_read" ON public.learner_credentials;
CREATE POLICY "lc_provider_admin_read" ON public.learner_credentials
  FOR SELECT USING (
    public.is_provider_admin()
    AND learner_id IN (
      SELECT id FROM public.profiles
      WHERE tenant_id = public.get_my_tenant_id()
    )
  );

-- =============================================================================
-- program_completion — provider_admin reads completions for their tenant
-- =============================================================================
DROP POLICY IF EXISTS "program_completion_provider_admin" ON public.program_completion;
CREATE POLICY "program_completion_provider_admin" ON public.program_completion
  FOR SELECT USING (
    public.is_provider_admin()
    AND program_id IN (
      SELECT id FROM public.programs
      WHERE tenant_id = public.get_my_tenant_id()
    )
  );

-- =============================================================================
-- Explicit DENY: provider_admin cannot access admin_audit_events of other tenants
-- (admin_audit_events has no tenant_id — provider_admin gets no access)
-- =============================================================================
-- No policy added for admin_audit_events — existing admin-only policy stands.
-- provider_admin is not in ('admin','super_admin') so they are already blocked.

COMMIT;
