-- Migration: Add tenant_id scope to all is_admin() policies missing it
-- Problem: 20260215_fix_rls_recursion.sql created admin policies with
--          USING(is_admin()) but no tenant_id predicate. Any admin from
--          any tenant can read/write all rows.
-- Fix: Drop and recreate each policy with tenant_id = get_current_tenant_id().
--      Tables without tenant_id keep is_admin() only (acceptable).
--      Tables that don't exist in live DB are skipped.

BEGIN;

-- ============================================================
-- TABLES WITH tenant_id — add tenant scope
-- ============================================================

-- agreements
DROP POLICY IF EXISTS "agreements_admin_all" ON agreements;
CREATE POLICY "agreements_admin_all" ON agreements
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- apprentice_assignments
DROP POLICY IF EXISTS "assignments_admin_all" ON apprentice_assignments;
CREATE POLICY "assignments_admin_all" ON apprentice_assignments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- attendance_hours (two separate policies: update + delete)
DROP POLICY IF EXISTS "hours_admin_update" ON attendance_hours;
CREATE POLICY "hours_admin_update" ON attendance_hours
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

DROP POLICY IF EXISTS "hours_admin_delete" ON attendance_hours;
CREATE POLICY "hours_admin_delete" ON attendance_hours
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- cohorts
DROP POLICY IF EXISTS "cohorts_admin_all" ON cohorts;
CREATE POLICY "cohorts_admin_all" ON cohorts
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- content_pages
DROP POLICY IF EXISTS "content_pages_admin_all" ON content_pages;
CREATE POLICY "content_pages_admin_all" ON content_pages
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- content_versions
DROP POLICY IF EXISTS "content_versions_admin_all" ON content_versions;
CREATE POLICY "content_versions_admin_all" ON content_versions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- credential_submissions
DROP POLICY IF EXISTS "credential_submissions_admin_all" ON credential_submissions;
CREATE POLICY "credential_submissions_admin_all" ON credential_submissions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- enrollment_transitions
DROP POLICY IF EXISTS "enrollment_transitions_admin" ON enrollment_transitions;
CREATE POLICY "enrollment_transitions_admin" ON enrollment_transitions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- forum_comments
DROP POLICY IF EXISTS "forum_comments_admin_all" ON forum_comments;
CREATE POLICY "forum_comments_admin_all" ON forum_comments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- franchises
DROP POLICY IF EXISTS "franchise_admin_all" ON franchises;
CREATE POLICY "franchise_admin_all" ON franchises
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- intakes
DROP POLICY IF EXISTS "intakes_admin_all" ON intakes;
CREATE POLICY "intakes_admin_all" ON intakes
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_organizations
DROP POLICY IF EXISTS "partner_orgs_admin_all" ON partner_organizations;
CREATE POLICY "partner_orgs_admin_all" ON partner_organizations
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_shops
DROP POLICY IF EXISTS "partner_shops_admin_all" ON partner_shops;
CREATE POLICY "partner_shops_admin_all" ON partner_shops
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_sites
DROP POLICY IF EXISTS "partner_sites_admin_all" ON partner_sites;
CREATE POLICY "partner_sites_admin_all" ON partner_sites
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- payment_plans
DROP POLICY IF EXISTS "payment_plans_admin_all" ON payment_plans;
CREATE POLICY "payment_plans_admin_all" ON payment_plans
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- shop_staff
DROP POLICY IF EXISTS "shop_staff_admin_manage" ON shop_staff;
CREATE POLICY "shop_staff_admin_manage" ON shop_staff
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- social_media_settings
DROP POLICY IF EXISTS "social_media_admin_all" ON social_media_settings;
CREATE POLICY "social_media_admin_all" ON social_media_settings
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- training_enrollments
DROP POLICY IF EXISTS "training_enrollments_admin_all" ON training_enrollments;
CREATE POLICY "training_enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- profiles (identity table — must be tenant-scoped)
DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- ============================================================
-- TABLES WITHOUT tenant_id — keep is_admin() only
-- These are acceptable until tenant_id is added to these tables.
-- Documenting here so the gap is visible:
--   applications, audit_logs, career_courses, document_requirements,
--   forum_posts, promo_codes, training_programs
-- ============================================================

-- enrollments is a VIEW over training_enrollments — drop the policy
-- (it was created on the view which doesn't support RLS)
DROP POLICY IF EXISTS "enrollments_admin_all" ON enrollments;

-- student_enrollments — no tenant_id, keep as-is
-- tax_documents, tax_filings, tax_returns — no tenant_id, keep as-is

COMMIT;
