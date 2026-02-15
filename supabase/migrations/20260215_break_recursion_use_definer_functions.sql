-- 20260215_break_recursion_use_definer_functions.sql
--
-- Eliminates all inline EXISTS(SELECT 1 FROM profiles ...) patterns from RLS policies.
-- Replaces with SECURITY DEFINER functions: is_admin(), is_super_admin(), get_current_tenant_id().
-- These functions bypass RLS on profiles, breaking the recursion cycle.
--
-- Fixes 2 recursive policies on profiles + 37 cross-table policies.
--
-- Run in Supabase SQL Editor.

-- ============================================================
-- MOVE 1: Fix recursive policies on profiles
-- ============================================================

-- 1a. profiles_admin_all: was recursive (queried profiles from profiles policy)
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- 1b. profiles_update_own_row_tenant_immutable: was recursive (subquery on profiles)
DROP POLICY IF EXISTS "profiles_update_own_row_tenant_immutable" ON profiles;

CREATE POLICY "profiles_update_own_row_tenant_immutable" ON profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR public.is_super_admin()
  )
  WITH CHECK (
    (auth.uid() = id OR public.is_super_admin())
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- ============================================================
-- MOVE 3: Fix all cross-table policies that inline profiles lookups
-- ============================================================

-- training_enrollments: 4 policies
DROP POLICY IF EXISTS "Admins can enroll users" ON training_enrollments;
CREATE POLICY "Admins can enroll users" ON training_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update enrollments" ON training_enrollments;
CREATE POLICY "Admins can update enrollments" ON training_enrollments
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete enrollments" ON training_enrollments;
CREATE POLICY "Admins can delete enrollments" ON training_enrollments
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "enrollments_admin_all" ON training_enrollments;
CREATE POLICY "enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "enrollments_partner_read" ON training_enrollments;
CREATE POLICY "enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = training_enrollments.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- certificates: 4 policies
DROP POLICY IF EXISTS "certificates_admin_insert" ON certificates;
CREATE POLICY "certificates_admin_insert" ON certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
CREATE POLICY "certificates_admin_update" ON certificates
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;
CREATE POLICY "certificates_admin_delete" ON certificates
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_partner_read" ON certificates;
CREATE POLICY "certificates_partner_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = certificates.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- lesson_progress: 2 policies
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON lesson_progress;
CREATE POLICY "lesson_progress_admin_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "lesson_progress_partner_read" ON lesson_progress;
CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = lesson_progress.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- apprentice_placements: 1 policy
DROP POLICY IF EXISTS "placements_admin_all" ON apprentice_placements;
CREATE POLICY "placements_admin_all" ON apprentice_placements
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- shops: 1 policy
DROP POLICY IF EXISTS "shops_admin_all" ON shops;
CREATE POLICY "shops_admin_all" ON shops
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- shop_staff: 1 policy
DROP POLICY IF EXISTS "shop_staff_admin_write" ON shop_staff;
CREATE POLICY "shop_staff_admin_write" ON shop_staff
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- programs: 1 policy
DROP POLICY IF EXISTS "programs_admin_write" ON programs;
CREATE POLICY "programs_admin_write" ON programs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- users: 1 policy
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users
  FOR ALL TO authenticated
  USING (public.is_admin());

-- sfc_tax_returns: 1 policy
DROP POLICY IF EXISTS "sfc_tax_returns_admin_all" ON sfc_tax_returns;
CREATE POLICY "sfc_tax_returns_admin_all" ON sfc_tax_returns
  FOR ALL TO authenticated
  USING (public.is_admin());

-- sfc_tax_documents: 1 policy
DROP POLICY IF EXISTS "sfc_tax_documents_admin_all" ON sfc_tax_documents;
CREATE POLICY "sfc_tax_documents_admin_all" ON sfc_tax_documents
  FOR ALL TO authenticated
  USING (public.is_admin());

-- mef_submissions: 3 policies (role includes tax_preparer)
-- Need a helper or inline check. is_admin() covers admin+super_admin.
-- For tax_preparer, we create a small definer function.
CREATE OR REPLACE FUNCTION public.is_tax_preparer()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'tax_preparer')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_tax_preparer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tax_preparer() TO authenticated;

DROP POLICY IF EXISTS "Admins can view all submissions" ON mef_submissions;
CREATE POLICY "Admins can view all submissions" ON mef_submissions
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

DROP POLICY IF EXISTS "Admins can insert submissions" ON mef_submissions;
CREATE POLICY "Admins can insert submissions" ON mef_submissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tax_preparer());

DROP POLICY IF EXISTS "Admins can update submissions" ON mef_submissions;
CREATE POLICY "Admins can update submissions" ON mef_submissions
  FOR UPDATE TO authenticated
  USING (public.is_tax_preparer());

-- tax_returns: 1 policy
DROP POLICY IF EXISTS "Admins can view all tax returns" ON tax_returns;
CREATE POLICY "Admins can view all tax returns" ON tax_returns
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

-- tax_clients: 1 policy
DROP POLICY IF EXISTS "Admins can view all clients" ON tax_clients;
CREATE POLICY "Admins can view all clients" ON tax_clients
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

-- career_courses: 1 policy
DROP POLICY IF EXISTS "Admins can manage courses" ON career_courses;
CREATE POLICY "Admins can manage courses" ON career_courses
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partner_documents: 1 policy
DROP POLICY IF EXISTS "Admins can manage all documents" ON partner_documents;
CREATE POLICY "Admins can manage all documents" ON partner_documents
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partners: 1 policy
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Admins can manage partners" ON partners
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partner_applications: 1 policy
DROP POLICY IF EXISTS "Admins can manage partner applications" ON partner_applications;
CREATE POLICY "Admins can manage partner applications" ON partner_applications
  FOR ALL TO authenticated
  USING (public.is_admin());

-- promo_codes: 1 policy
DROP POLICY IF EXISTS "promo_codes_admin" ON promo_codes;
CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_apprentices: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS apprentices" ON rapids_apprentices;
CREATE POLICY "Admins can manage RAPIDS apprentices" ON rapids_apprentices
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_progress_updates: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS progress" ON rapids_progress_updates;
CREATE POLICY "Admins can manage RAPIDS progress" ON rapids_progress_updates
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_submissions: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS submissions" ON rapids_submissions;
CREATE POLICY "Admins can manage RAPIDS submissions" ON rapids_submissions
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_employers: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS employers" ON rapids_employers;
CREATE POLICY "Admins can manage RAPIDS employers" ON rapids_employers
  FOR ALL TO authenticated
  USING (public.is_admin());

-- staff_permissions: 2 policies
DROP POLICY IF EXISTS "Tenant admins can manage staff permissions" ON staff_permissions;
CREATE POLICY "Tenant admins can manage staff permissions" ON staff_permissions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND tenant_id = public.get_current_tenant_id()
  );

DROP POLICY IF EXISTS "Super admins can manage all permissions" ON staff_permissions;
CREATE POLICY "Super admins can manage all permissions" ON staff_permissions
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- application_state_events: 1 policy
DROP POLICY IF EXISTS "Admins can view all state events" ON application_state_events;
CREATE POLICY "Admins can view all state events" ON application_state_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- apprentice_sites: 2 policies
DROP POLICY IF EXISTS "Partner users can view own sites" ON apprentice_sites;
CREATE POLICY "Partner users can view own sites" ON apprentice_sites
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage sites" ON apprentice_sites;
CREATE POLICY "Admins can manage sites" ON apprentice_sites
  FOR ALL TO authenticated
  USING (public.is_admin());
