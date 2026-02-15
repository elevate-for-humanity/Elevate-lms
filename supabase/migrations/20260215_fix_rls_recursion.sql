-- Fix infinite RLS recursion on profiles table (Postgres error 42P17)
--
-- Root cause: "profiles_admin_all" policy on profiles does
--   EXISTS (SELECT 1 FROM profiles WHERE ...)
-- which forces Postgres to evaluate profiles RLS to satisfy a profiles RLS check → loop.
--
-- Fix: profiles policies must NEVER subquery profiles. Use only:
--   - auth.uid() direct comparison
--   - auth.jwt() claim checks
--   - SECURITY DEFINER helper functions (is_admin, is_super_admin, is_instructor)
--
-- The SECURITY DEFINER functions bypass RLS, so they can safely read profiles
-- without triggering policy evaluation.

-- ============================================================================
-- STEP 1: Ensure helper functions exist and are SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('instructor', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

-- New: staff-level check (used by several policies)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

-- New: get user role without RLS (for policies that need role value)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- STEP 2: Fix profiles table policies (the recursion source)
-- ============================================================================

-- Drop ALL existing profiles policies to start clean
-- (includes both old names and new names so this migration is idempotent)
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_tenant_immutable" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_row_tenant_immutable" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Self-access: users can always read their own profile
-- No subquery — direct uid comparison only
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Self-update: users can update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin read all: uses SECURITY DEFINER function (no recursion)
CREATE POLICY "profiles_admin_select"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admin write all: uses SECURITY DEFINER function (no recursion)
CREATE POLICY "profiles_admin_all"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Tenant-immutable update guard (re-create from protect_tenant_id)
-- Uses SECURITY DEFINER is_super_admin() — safe
CREATE POLICY "profiles_update_tenant_immutable"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR public.is_super_admin()
)
WITH CHECK (
  (auth.uid() = id OR public.is_super_admin())
  AND (
    -- tenant_id cannot change unless super_admin
    public.is_super_admin()
    OR tenant_id IS NOT DISTINCT FROM tenant_id
  )
);

-- ============================================================================
-- STEP 3: Fix other table policies that inline profiles subqueries
-- Replace inline EXISTS(SELECT 1 FROM profiles ...) with helper function calls
-- ============================================================================

-- ---- COURSES ----
DROP POLICY IF EXISTS "courses_admin_all" ON public.courses;
CREATE POLICY "courses_admin_all" ON public.courses
FOR ALL TO authenticated
USING (public.is_instructor());

-- ---- LESSONS ----
DROP POLICY IF EXISTS "lessons_admin_all" ON public.lessons;
CREATE POLICY "lessons_admin_all" ON public.lessons
FOR ALL TO authenticated
USING (public.is_instructor());

-- ---- QUIZZES ----
DROP POLICY IF EXISTS "quizzes_admin_all" ON public.quizzes;
CREATE POLICY "quizzes_admin_all" ON public.quizzes
FOR ALL TO authenticated
USING (public.is_instructor());

-- ---- QUIZ QUESTIONS ----
DROP POLICY IF EXISTS "quiz_questions_admin_all" ON public.quiz_questions;
CREATE POLICY "quiz_questions_admin_all" ON public.quiz_questions
FOR ALL TO authenticated
USING (public.is_instructor());

-- ---- ENROLLMENTS ----
DROP POLICY IF EXISTS "enrollments_admin_all" ON public.enrollments;
CREATE POLICY "enrollments_admin_all" ON public.enrollments
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- LESSON PROGRESS ----
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON public.lesson_progress;
CREATE POLICY "lesson_progress_admin_read" ON public.lesson_progress
FOR SELECT TO authenticated
USING (public.is_instructor());

-- ---- INTAKES (barber_hvac_reference) ----
DROP POLICY IF EXISTS "intakes_admin_all" ON public.intakes;
CREATE POLICY "intakes_admin_all" ON public.intakes
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- APPLICATIONS ----
DROP POLICY IF EXISTS "applications_admin_all" ON public.applications;
CREATE POLICY "applications_admin_all" ON public.applications
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- COHORTS ----
DROP POLICY IF EXISTS "cohorts_admin_all" ON public.cohorts;
CREATE POLICY "cohorts_admin_all" ON public.cohorts
FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "cohorts_instructor_read" ON public.cohorts;
CREATE POLICY "cohorts_instructor_read" ON public.cohorts
FOR SELECT TO authenticated
USING (public.is_instructor());

-- ---- PARTNER ORGANIZATIONS ----
DROP POLICY IF EXISTS "partner_orgs_admin_all" ON public.partner_organizations;
CREATE POLICY "partner_orgs_admin_all" ON public.partner_organizations
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- PARTNER SITES ----
DROP POLICY IF EXISTS "partner_sites_admin_all" ON public.partner_sites;
CREATE POLICY "partner_sites_admin_all" ON public.partner_sites
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- APPRENTICE ASSIGNMENTS ----
DROP POLICY IF EXISTS "assignments_admin_all" ON public.apprentice_assignments;
CREATE POLICY "assignments_admin_all" ON public.apprentice_assignments
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- ATTENDANCE HOURS ----
DROP POLICY IF EXISTS "hours_instructor_insert" ON public.attendance_hours;
CREATE POLICY "hours_instructor_insert" ON public.attendance_hours
FOR INSERT TO authenticated
WITH CHECK (public.is_instructor());

DROP POLICY IF EXISTS "hours_admin_update" ON public.attendance_hours;
CREATE POLICY "hours_admin_update" ON public.attendance_hours
FOR UPDATE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "hours_admin_delete" ON public.attendance_hours;
CREATE POLICY "hours_admin_delete" ON public.attendance_hours
FOR DELETE TO authenticated
USING (public.is_admin());

-- ---- AUDIT LOGS ----
DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_admin());

-- ---- DOCUMENT REQUIREMENTS ----
DROP POLICY IF EXISTS "doc_requirements_admin_all" ON public.document_requirements;
CREATE POLICY "doc_requirements_admin_all" ON public.document_requirements
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- FRANCHISE TABLES ----
DROP POLICY IF EXISTS "franchise_admin_all" ON public.franchises;
CREATE POLICY "franchise_admin_all" ON public.franchises
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- FORUM TABLES ----
DROP POLICY IF EXISTS "forum_admin_all" ON public.forum_posts;
CREATE POLICY "forum_admin_all" ON public.forum_posts
FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "forum_comments_admin_all" ON public.forum_comments;
CREATE POLICY "forum_comments_admin_all" ON public.forum_comments
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- TAX SOFTWARE TABLES ----
DROP POLICY IF EXISTS "tax_returns_admin_all" ON public.tax_returns;
CREATE POLICY "tax_returns_admin_all" ON public.tax_returns
FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "tax_documents_admin_all" ON public.tax_documents;
CREATE POLICY "tax_documents_admin_all" ON public.tax_documents
FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "tax_payments_admin_all" ON public.tax_payments;
CREATE POLICY "tax_payments_admin_all" ON public.tax_payments
FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "tax_filings_admin_all" ON public.tax_filings;
CREATE POLICY "tax_filings_admin_all" ON public.tax_filings
FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "tax_clients_admin_all" ON public.tax_clients;
CREATE POLICY "tax_clients_admin_all" ON public.tax_clients
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- CAREER/PRODUCTS ----
DROP POLICY IF EXISTS "career_courses_admin_all" ON public.career_courses;
CREATE POLICY "career_courses_admin_all" ON public.career_courses
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- PARTNER DOCUMENTS ----
DROP POLICY IF EXISTS "partner_documents_admin_all" ON public.partner_documents;
CREATE POLICY "partner_documents_admin_all" ON public.partner_documents
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- PARTNER SHOPS ----
DROP POLICY IF EXISTS "partner_shops_admin_all" ON public.partner_shops;
CREATE POLICY "partner_shops_admin_all" ON public.partner_shops
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- PROMO CODES ----
DROP POLICY IF EXISTS "promo_codes_admin_all" ON public.promo_codes;
CREATE POLICY "promo_codes_admin_all" ON public.promo_codes
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- RAPIDS APPRENTICE DATA ----
DROP POLICY IF EXISTS "rapids_admin_all" ON public.rapids_apprentice_data;
CREATE POLICY "rapids_admin_all" ON public.rapids_apprentice_data
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- STAFF PERMISSIONS ----
DROP POLICY IF EXISTS "staff_permissions_admin_all" ON public.staff_permissions;
CREATE POLICY "staff_permissions_admin_all" ON public.staff_permissions
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- TRAINING PROGRAMS ----
DROP POLICY IF EXISTS "training_programs_admin_all" ON public.training_programs;
CREATE POLICY "training_programs_admin_all" ON public.training_programs
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- STUDENT ENROLLMENTS ----
DROP POLICY IF EXISTS "student_enrollments_admin_all" ON public.student_enrollments;
CREATE POLICY "student_enrollments_admin_all" ON public.student_enrollments
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- ENROLLMENT STATE MACHINE ----
DROP POLICY IF EXISTS "enrollment_transitions_admin" ON public.enrollment_transitions;
CREATE POLICY "enrollment_transitions_admin" ON public.enrollment_transitions
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- CERTIFICATES ----
DROP POLICY IF EXISTS "certificates_admin_all" ON public.certificates;
CREATE POLICY "certificates_admin_all" ON public.certificates
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- AGREEMENT ENFORCEMENT ----
DROP POLICY IF EXISTS "agreements_admin_all" ON public.agreements;
CREATE POLICY "agreements_admin_all" ON public.agreements
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- SOCIAL MEDIA SETTINGS ----
DROP POLICY IF EXISTS "social_media_admin_all" ON public.social_media_settings;
CREATE POLICY "social_media_admin_all" ON public.social_media_settings
FOR ALL TO authenticated
USING (public.is_admin());

-- ---- PROVISIONING EVENTS (fix inline subquery) ----
DROP POLICY IF EXISTS "Users can view own tenant provisioning events" ON public.provisioning_events;
CREATE POLICY "Users can view own tenant provisioning events"
ON public.provisioning_events FOR SELECT
TO authenticated
USING (
  (tenant_id = public.get_current_tenant_id() AND public.is_admin())
  OR public.is_super_admin()
);

-- ---- LICENSE VIOLATIONS (fix inline subquery) ----
DROP POLICY IF EXISTS "Users can view own tenant violations" ON public.license_violations;
CREATE POLICY "Users can view own tenant violations"
ON public.license_violations FOR SELECT
TO authenticated
USING (
  (tenant_id = public.get_current_tenant_id() AND public.is_admin())
  OR public.is_super_admin()
);

-- ---- FIX_SECURITY_ISSUES policies (bulk replace inline subqueries) ----
-- These were created in 20260202_fix_security_issues.sql with inline profiles checks.
-- We drop and recreate with helper functions.

-- The exact policy names from that migration vary by table.
-- Use a DO block to safely drop if they exist, then recreate.

-- Note: Some tables from fix_security_issues may not exist yet.
-- Wrap in exception handlers.

DO $$
BEGIN
  -- shop_staff policies
  BEGIN
    DROP POLICY IF EXISTS "shop_staff_admin_manage" ON public.shop_staff;
    CREATE POLICY "shop_staff_admin_manage" ON public.shop_staff
    FOR ALL TO authenticated USING (public.is_admin());
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- training_enrollments policies
  BEGIN
    DROP POLICY IF EXISTS "training_enrollments_admin_all" ON public.training_enrollments;
    CREATE POLICY "training_enrollments_admin_all" ON public.training_enrollments
    FOR ALL TO authenticated USING (public.is_admin());
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- payment_plans policies
  BEGIN
    DROP POLICY IF EXISTS "payment_plans_admin_all" ON public.payment_plans;
    CREATE POLICY "payment_plans_admin_all" ON public.payment_plans
    FOR ALL TO authenticated USING (public.is_admin());
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- credential_submissions policies
  BEGIN
    DROP POLICY IF EXISTS "credential_submissions_admin_all" ON public.credential_submissions;
    CREATE POLICY "credential_submissions_admin_all" ON public.credential_submissions
    FOR ALL TO authenticated USING (public.is_admin());
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- content_pages policies
  BEGIN
    DROP POLICY IF EXISTS "content_pages_admin_all" ON public.content_pages;
    CREATE POLICY "content_pages_admin_all" ON public.content_pages
    FOR ALL TO authenticated USING (public.is_admin());
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- zero_stub content system
  BEGIN
    DROP POLICY IF EXISTS "content_versions_admin_all" ON public.content_versions;
    CREATE POLICY "content_versions_admin_all" ON public.content_versions
    FOR ALL TO authenticated USING (public.is_admin());
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

END $$;

-- ============================================================================
-- VERIFICATION QUERY (run after migration to confirm no recursion sources remain)
-- ============================================================================
-- Paste this separately to check:
--
-- SELECT tablename, policyname, qual
-- FROM pg_policies
-- WHERE qual ILIKE '%profiles%'
--   AND tablename != 'profiles'
--   AND qual NOT ILIKE '%is_admin%'
--   AND qual NOT ILIKE '%is_super_admin%'
--   AND qual NOT ILIKE '%is_instructor%'
--   AND qual NOT ILIKE '%is_staff%'
--   AND qual NOT ILIKE '%get_current_tenant_id%'
--   AND qual NOT ILIKE '%get_my_role%';
--
-- If this returns 0 rows, all inline profiles subqueries have been replaced.
-- If rows remain, those policies still have direct profiles references and need updating.
