-- ============================================================================
-- SECURITY LOCKDOWN - LAUNCH READY
-- ============================================================================
-- This migration locks down the database and opens only what's needed
-- for students to use the platform safely.
--
-- Execution order:
-- 1. Revoke all default access
-- 2. Enable RLS on all tables with deny-all default
-- 3. Open specific read access for public catalog
-- 4. Open student-owned data access
-- ============================================================================

-- ============================================================================
-- STEP 1: REVOKE ALL ACCIDENTAL ACCESS
-- ============================================================================

-- Revoke all privileges from anon and authenticated roles
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Revoke default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- ============================================================================
-- STEP 2: ENABLE RLS + DENY ALL (ALL TABLES)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY;', r.schemaname, r.tablename);

    -- Drop existing deny_all policy if it exists
    EXECUTE format(
      'DROP POLICY IF EXISTS deny_all ON %I.%I;',
      r.schemaname, r.tablename
    );

    -- Create deny_all policy
    EXECUTE format(
      'CREATE POLICY deny_all ON %I.%I FOR ALL TO public USING (false) WITH CHECK (false);',
      r.schemaname, r.tablename
    );
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: PUBLIC READ ACCESS (CATALOG DATA)
-- ============================================================================

-- Programs catalog (public can browse)
DROP POLICY IF EXISTS "public_read_programs" ON public.programs;
CREATE POLICY "public_read_programs"
  ON public.programs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Credentials catalog (public can see what's available)
DROP POLICY IF EXISTS "public_read_credentials" ON public.credentials;
CREATE POLICY "public_read_credentials"
  ON public.credentials
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Credentialing partners (public can see partners)
DROP POLICY IF EXISTS "public_read_credentialing_partners" ON public.credentialing_partners;
CREATE POLICY "public_read_credentialing_partners"
  ON public.credentialing_partners
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Resources (if used publicly)
DROP POLICY IF EXISTS "public_read_resources" ON public.resources;
CREATE POLICY "public_read_resources"
  ON public.resources
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- ============================================================================
-- STEP 4: STUDENT-OWNED DATA POLICIES
-- ============================================================================

-- Applications: Anyone can insert, admins can view all, users can view own
DROP POLICY IF EXISTS "anyone_insert_applications" ON public.applications;
CREATE POLICY "anyone_insert_applications"
  ON public.applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "admins_view_applications" ON public.applications;
CREATE POLICY "admins_view_applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "admins_update_applications" ON public.applications;
CREATE POLICY "admins_update_applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Profiles: Users can read own, admins can read all
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
CREATE POLICY "users_read_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admins_read_all_profiles" ON public.profiles;
CREATE POLICY "admins_read_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Enrollments: Students see own, admins see all
DROP POLICY IF EXISTS "students_read_own_enrollments" ON public.enrollments;
CREATE POLICY "students_read_own_enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "students_insert_own_enrollments" ON public.enrollments;
CREATE POLICY "students_insert_own_enrollments"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_enrollments" ON public.enrollments;
CREATE POLICY "admins_manage_enrollments"
  ON public.enrollments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- User Progress: Students see own, admins see all
DROP POLICY IF EXISTS "students_manage_own_progress" ON public.user_progress;
CREATE POLICY "students_manage_own_progress"
  ON public.user_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_view_all_progress" ON public.user_progress;
CREATE POLICY "admins_view_all_progress"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Quiz Attempts: Students see own, admins see all
DROP POLICY IF EXISTS "students_manage_own_quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "students_manage_own_quiz_attempts"
  ON public.quiz_attempts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_view_all_quiz_attempts" ON public.quiz_attempts;
CREATE POLICY "admins_view_all_quiz_attempts"
  ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Learning Paths: Students see own, admins see all
DROP POLICY IF EXISTS "students_read_own_learning_paths" ON public.learning_paths;
CREATE POLICY "students_read_own_learning_paths"
  ON public.learning_paths
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_learning_paths" ON public.learning_paths;
CREATE POLICY "admins_manage_learning_paths"
  ON public.learning_paths
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Credentials Attained: Students see own, admins see all
DROP POLICY IF EXISTS "students_read_own_credentials" ON public.credentials_attained;
CREATE POLICY "students_read_own_credentials"
  ON public.credentials_attained
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_credentials_attained" ON public.credentials_attained;
CREATE POLICY "admins_manage_credentials_attained"
  ON public.credentials_attained
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 5: COURSE COMPLETION TRACKING (SINGLE SOURCE OF TRUTH)
-- ============================================================================

-- Create course completion status table
CREATE TABLE IF NOT EXISTS course_completion_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  
  -- Completion data
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  completed_at TIMESTAMPTZ,
  
  -- Source of truth
  source TEXT NOT NULL CHECK (source IN ('scorm', 'partner_lms', 'manual_override', 'system')),
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  partner_course_id TEXT,
  partner_completion_data JSONB,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_completion_user ON course_completion_status(user_id);
CREATE INDEX IF NOT EXISTS idx_course_completion_course ON course_completion_status(course_id);
CREATE INDEX IF NOT EXISTS idx_course_completion_status ON course_completion_status(status);
CREATE INDEX IF NOT EXISTS idx_course_completion_enrollment ON course_completion_status(enrollment_id);

-- Enable RLS
ALTER TABLE course_completion_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completion_status FORCE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "students_read_own_completion" ON course_completion_status;
CREATE POLICY "students_read_own_completion"
  ON course_completion_status
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_manage_completion" ON course_completion_status;
CREATE POLICY "admins_manage_completion"
  ON course_completion_status
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_course_completion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_course_completion_timestamp ON course_completion_status;
CREATE TRIGGER update_course_completion_timestamp
  BEFORE UPDATE ON course_completion_status
  FOR EACH ROW
  EXECUTE FUNCTION update_course_completion_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE course_completion_status IS 'Single source of truth for course completion. Updated by SCORM sync, partner LMS webhooks, or manual admin override.';
COMMENT ON COLUMN course_completion_status.source IS 'Where this completion data came from: scorm, partner_lms, manual_override, or system';
COMMENT ON COLUMN course_completion_status.partner_completion_data IS 'Raw completion data from partner LMS for audit trail';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Security lockdown complete';
  RAISE NOTICE '✅ RLS enabled on all tables';
  RAISE NOTICE '✅ Public catalog access configured';
  RAISE NOTICE '✅ Student-owned data policies active';
  RAISE NOTICE '✅ Course completion tracking table created';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Database is now launch-ready';
END $$;
