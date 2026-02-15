-- 20260214_remove_null_tenant_fallbacks.sql
--
-- Removes "OR tenant_id IS NULL" fallbacks from all RLS policies.
-- Run ONLY after:
--   1. 20260214_backfill_tenant_id.sql (zero NULLs confirmed)
--   2. 20260214_enforce_tenant_not_null.sql (constraints validated)
--
-- This converts policies from "tenant match OR NULL" to strict "tenant match only."

-- profiles: replace admin policy
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- enrollments: replace admin policy
DROP POLICY IF EXISTS "enrollments_admin_all" ON training_enrollments;

CREATE POLICY "enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- certificates: replace admin policies
DROP POLICY IF EXISTS "certificates_admin_insert" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;

CREATE POLICY "certificates_admin_insert" ON certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

CREATE POLICY "certificates_admin_update" ON certificates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

CREATE POLICY "certificates_admin_delete" ON certificates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- apprentice_placements: replace admin policy
DROP POLICY IF EXISTS "placements_admin_all" ON apprentice_placements;

CREATE POLICY "placements_admin_all" ON apprentice_placements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- lesson_progress: replace admin policy
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON lesson_progress;

CREATE POLICY "lesson_progress_admin_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );
