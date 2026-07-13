-- Migration: Fix certificate RLS policies
-- Problem: certificates_public_verify USING(true) allows any user to read all certs.
--          certificates_admin_all USING(is_admin()) has no tenant scope.
--          "Users can view own certificates" has no tenant scope.
-- Fix: Drop all three, replace with tenant-scoped equivalents + narrow public verify.

BEGIN;

-- ============================================================
-- 1. Drop the three broken policies
-- ============================================================
DROP POLICY IF EXISTS "certificates_public_verify" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_all" ON certificates;
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;

-- ============================================================
-- 2. Public certificate verification — narrow surface
--    Only exposes rows that have a verification_url set.
--    No tenant scope needed: verification is intentionally public.
--    Uses anon role so unauthenticated visitors can verify.
-- ============================================================
DROP POLICY IF EXISTS "certificates_public_verify" ON certificates;
CREATE POLICY "certificates_public_verify" ON certificates
  FOR SELECT TO anon, authenticated
  USING (verification_url IS NOT NULL);

-- ============================================================
-- 3. Users can read their own certificates (within tenant)
-- ============================================================
DROP POLICY IF EXISTS "certificates_user_read" ON certificates;
CREATE POLICY "certificates_user_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND tenant_id = public.get_current_tenant_id()
  );

-- ============================================================
-- 4. Admin read — tenant-scoped (replaces certificates_admin_all)
--    INSERT/UPDATE/DELETE already tenant-scoped from prior migration.
-- ============================================================
DROP POLICY IF EXISTS "certificates_admin_read" ON certificates;
CREATE POLICY "certificates_admin_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

COMMIT;
