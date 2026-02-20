-- ============================================================================
-- PHASE 1c: ENABLE RLS + TENANT-ENFORCING POLICIES ON CORE TABLES
-- ============================================================================
-- Run AFTER run_part18_tenant_backfill.sql
--
-- This enables RLS and creates tenant-scoped policies on the 12 core tables
-- that form the LMS spine. The pattern:
--
--   SELECT:  user can only read rows matching their tenant
--   INSERT:  user can only insert rows for their tenant
--   UPDATE:  user can only update rows in their tenant
--   DELETE:  user can only delete rows in their tenant
--
-- Tenant is resolved via: profiles.tenant_id WHERE profiles.id = auth.uid()
--
-- Super-admin bypass: profiles.role = 'super_admin' can access all tenants.
-- ============================================================================

-- Helper function: get the current user's tenant_id
-- Uses get_current_tenant_id() name for compatibility with existing migrations.
-- CREATE OR REPLACE is safe — overwrites any prior version.
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT p.tenant_id INTO v_tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
  RETURN v_tenant_id;
END;
$$;

-- Alias for code that references get_user_tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_tenant_id()
$$;

-- Helper function: check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

-- Helper function: check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
    OR id = auth.uid()  -- users can always read their own profile
  );

CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (
    is_super_admin()
    OR id = auth.uid()  -- users can update their own profile
  );

CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR id = auth.uid()  -- user can create their own profile on signup
  );

-- ============================================================================
-- 2. COURSES
-- ============================================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY courses_select ON courses FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY courses_insert ON courses FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY courses_update ON courses FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY courses_delete ON courses FOR DELETE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

-- ============================================================================
-- 3. ENROLLMENTS
-- ============================================================================
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY enrollments_select ON enrollments FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
    OR user_id = auth.uid()  -- students see their own enrollments
  );

CREATE POLICY enrollments_insert ON enrollments FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY enrollments_update ON enrollments FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY enrollments_delete ON enrollments FOR DELETE
  USING (
    is_super_admin()
  );

-- ============================================================================
-- 4. PROGRAMS
-- ============================================================================
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY programs_select ON programs FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY programs_insert ON programs FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY programs_update ON programs FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY programs_delete ON programs FOR DELETE
  USING (
    is_super_admin()
  );

-- ============================================================================
-- 5. CERTIFICATES
-- ============================================================================
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY certificates_select ON certificates FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
    OR user_id = auth.uid()  -- students see their own certs
  );

CREATE POLICY certificates_insert ON certificates FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY certificates_update ON certificates FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

-- ============================================================================
-- 6. LESSONS
-- ============================================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY lessons_select ON lessons FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY lessons_insert ON lessons FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY lessons_update ON lessons FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY lessons_delete ON lessons FOR DELETE
  USING (
    is_super_admin()
  );

-- ============================================================================
-- 7. MODULES
-- ============================================================================
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY modules_select ON modules FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY modules_insert ON modules FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY modules_update ON modules FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY modules_delete ON modules FOR DELETE
  USING (
    is_super_admin()
  );

-- ============================================================================
-- 8. ASSIGNMENTS
-- ============================================================================
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY assignments_select ON assignments FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY assignments_insert ON assignments FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY assignments_update ON assignments FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

-- ============================================================================
-- 9. GRADES
-- ============================================================================
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY grades_select ON grades FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY grades_insert ON grades FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY grades_update ON grades FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

-- ============================================================================
-- 10. LESSON_PROGRESS
-- ============================================================================
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY lesson_progress_select ON lesson_progress FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY lesson_progress_insert ON lesson_progress FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY lesson_progress_update ON lesson_progress FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

-- ============================================================================
-- 11. JOB_PLACEMENTS
-- ============================================================================
ALTER TABLE job_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_placements_select ON job_placements FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY job_placements_insert ON job_placements FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY job_placements_update ON job_placements FOR UPDATE
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

-- ============================================================================
-- 12. NOTIFICATIONS
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
    OR user_id = auth.uid()  -- users see their own notifications
  );

CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR tenant_id = get_current_tenant_id()
  );

CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (
    is_super_admin()
    OR user_id = auth.uid()  -- users can mark their own as read
  );
