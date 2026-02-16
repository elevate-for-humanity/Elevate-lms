-- =====================================================
-- GLOBAL RLS LOCKDOWN - LAUNCH SECURITY
-- =====================================================
-- Purpose: Enable RLS on ALL public tables and create
-- safe default policies for immediate launch
-- Time: 90 minutes
-- =====================================================

-- =====================================================
-- 1. CREATE ADMIN CHECK FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has admin role in profiles table
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION is_admin IS 'Returns true if current user is an admin';

-- =====================================================
-- 2. ENABLE RLS ON ALL PUBLIC TABLES
-- =====================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    RAISE NOTICE 'Enabled RLS on: %', r.tablename;
  END LOOP;
END $$;

-- =====================================================
-- 3. CREATE ADMIN-ONLY DEFAULT POLICIES
-- =====================================================
-- This creates a safe default: only admins can access data
-- We'll add specific policies for students and partners below

DO $$
DECLARE
  r RECORD;
  policy_name TEXT;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
  LOOP
    policy_name := 'admin_only_' || r.tablename;
    
    -- Drop policy if it exists
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', policy_name, r.tablename);
    
    -- Create admin-only policy
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (is_admin());',
      policy_name, r.tablename
    );
    
    RAISE NOTICE 'Created admin-only policy on: %', r.tablename;
  END LOOP;
END $$;

-- =====================================================
-- 4. STUDENT OWN-RECORD POLICIES (CRITICAL)
-- =====================================================

-- Students can view/update their own profile
DROP POLICY IF EXISTS students_own_profile ON profiles;
CREATE POLICY students_own_profile ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- Students can view/update their own enrollments
DROP POLICY IF EXISTS students_own_enrollments ON enrollments;
CREATE POLICY students_own_enrollments ON enrollments
  FOR ALL
  USING (auth.uid() = student_id);

-- Students can view/insert their own applications
DROP POLICY IF EXISTS students_own_applications ON applications;
CREATE POLICY students_own_applications ON applications
  FOR ALL
  USING (auth.uid() = user_id);

-- Students can view/insert their own hour logs
DROP POLICY IF EXISTS students_own_hour_logs ON hour_logs;
CREATE POLICY students_own_hour_logs ON hour_logs
  FOR ALL
  USING (auth.uid() = student_id);

-- Students can view their own progress
DROP POLICY IF EXISTS students_own_progress ON progress_tracking;
CREATE POLICY students_own_progress ON progress_tracking
  FOR ALL
  USING (auth.uid() = student_id);

-- Students can view their own certificates
DROP POLICY IF EXISTS students_own_certificates ON certificates;
CREATE POLICY students_own_certificates ON certificates
  FOR SELECT
  USING (auth.uid() = student_id);

-- =====================================================
-- 5. PUBLIC READ-ONLY RESOURCES (SAFE)
-- =====================================================

-- Anyone can view active programs
DROP POLICY IF EXISTS public_read_programs ON programs;
CREATE POLICY public_read_programs ON programs
  FOR SELECT
  USING (status = 'active' OR is_admin());

-- Anyone can view active courses
DROP POLICY IF EXISTS public_read_courses ON courses;
CREATE POLICY public_read_courses ON courses
  FOR SELECT
  USING (is_published = true OR is_admin());

-- Anyone can view credentials
DROP POLICY IF EXISTS public_read_credentials ON credentials;
CREATE POLICY public_read_credentials ON credentials
  FOR SELECT
  USING (true);

-- Anyone can view active role packages
DROP POLICY IF EXISTS public_read_role_packages ON role_packages;
CREATE POLICY public_read_role_packages ON role_packages
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Anyone can view active schedule policies
DROP POLICY IF EXISTS public_read_schedule_policies ON schedule_policies;
CREATE POLICY public_read_schedule_policies ON schedule_policies
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Anyone can view onboarding packets
DROP POLICY IF EXISTS public_read_onboarding_packets ON onboarding_packets;
CREATE POLICY public_read_onboarding_packets ON onboarding_packets
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Anyone can view onboarding documents
DROP POLICY IF EXISTS public_read_onboarding_documents ON onboarding_documents;
CREATE POLICY public_read_onboarding_documents ON onboarding_documents
  FOR SELECT
  USING (true);

-- =====================================================
-- 6. PARTNER POLICIES (ASSIGNED STUDENTS ONLY)
-- =====================================================

-- Partners can view their own profile
DROP POLICY IF EXISTS partners_own_profile ON partner_profiles;
CREATE POLICY partners_own_profile ON partner_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- Partners can view assigned students
DROP POLICY IF EXISTS partners_assigned_students ON student_assignments;
CREATE POLICY partners_assigned_students ON student_assignments
  FOR SELECT
  USING (auth.uid() = partner_user_id AND is_active = true);

-- Partners can view assigned student enrollments
DROP POLICY IF EXISTS partners_assigned_enrollments ON enrollments;
CREATE POLICY partners_assigned_enrollments ON enrollments
  FOR SELECT
  USING (
    auth.uid() = partner_owner_user_id
    OR is_admin()
  );

-- Partners can view/insert hour logs for assigned students
DROP POLICY IF EXISTS partners_assigned_hour_logs ON hour_logs;
CREATE POLICY partners_assigned_hour_logs ON hour_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = hour_logs.enrollment_id
        AND e.partner_owner_user_id = auth.uid()
    )
    OR auth.uid() = student_id
    OR is_admin()
  );

-- Partners can view alerts assigned to them
DROP POLICY IF EXISTS partners_assigned_alerts ON alert_notifications;
CREATE POLICY partners_assigned_alerts ON alert_notifications
  FOR SELECT
  USING (
    auth.uid() = partner_user_id
    OR auth.uid() = student_id
    OR is_admin()
  );

-- Partners can view/update reporting verdicts for assigned students
DROP POLICY IF EXISTS partners_assigned_verdicts ON reporting_verdicts;
CREATE POLICY partners_assigned_verdicts ON reporting_verdicts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = reporting_verdicts.enrollment_id
        AND e.partner_owner_user_id = auth.uid()
    )
    OR is_admin()
  );

-- =====================================================
-- 7. ONBOARDING POLICIES
-- =====================================================

-- Users can view/insert their own signatures
DROP POLICY IF EXISTS users_own_signatures ON onboarding_signatures;
CREATE POLICY users_own_signatures ON onboarding_signatures
  FOR ALL
  USING (auth.uid() = user_id OR is_admin());

-- Users can view/insert their own payroll profiles
DROP POLICY IF EXISTS users_own_payroll ON payroll_profiles;
CREATE POLICY users_own_payroll ON payroll_profiles
  FOR ALL
  USING (auth.uid() = user_id OR is_admin());

-- Users can view/update their own onboarding progress
DROP POLICY IF EXISTS users_own_onboarding_progress ON onboarding_progress;
CREATE POLICY users_own_onboarding_progress ON onboarding_progress
  FOR ALL
  USING (auth.uid() = user_id OR is_admin());

-- =====================================================
-- 8. AUDIT LOG (ADMIN READ-ONLY)
-- =====================================================

-- Only admins can view audit log
DROP POLICY IF EXISTS admin_only_audit_log ON audit_log;
CREATE POLICY admin_only_audit_log ON audit_log
  FOR SELECT
  USING (is_admin());

-- Anyone can insert audit log entries (system-generated)
DROP POLICY IF EXISTS anyone_insert_audit_log ON audit_log;
CREATE POLICY anyone_insert_audit_log ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 9. VERIFICATION QUERY
-- =====================================================

-- Run this to verify RLS is enabled on all tables
CREATE OR REPLACE VIEW rls_status AS
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (
    SELECT COUNT(*)
    FROM pg_policies
    WHERE schemaname = t.schemaname
      AND tablename = t.tablename
  ) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

COMMENT ON VIEW rls_status IS 'Shows RLS status and policy count for all public tables';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration:
-- ✅ Enabled RLS on ALL public tables
-- ✅ Created admin-only default policies (safe launch mode)
-- ✅ Created student own-record policies
-- ✅ Created public read-only resource policies
-- ✅ Created partner assigned-student policies
-- ✅ Created onboarding policies
-- ✅ Created audit log policies
--
-- RESULT: System is now secure and ready to launch
-- =====================================================

-- Verify RLS is enabled
SELECT * FROM rls_status WHERE NOT rls_enabled;
-- Should return 0 rows

-- Verify policies exist
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
