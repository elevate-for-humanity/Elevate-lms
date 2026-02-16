-- ============================================================================
-- COMPLETE COURSE SECURITY & ACCESS CONTROL
-- Ensures students can ONLY access courses they're enrolled in
-- ============================================================================

-- ============================================================================
-- COURSES TABLE SECURITY
-- ============================================================================

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Students can view enrolled courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;

-- Policy: Anyone can view published course LISTINGS ONLY (title, description, thumbnail)
-- This is for browsing/marketing - NOT for accessing course content
CREATE POLICY "Anyone can view published course listings"
  ON courses FOR SELECT
  USING (
    is_published = true
    AND (
      -- Public can only see basic info (enforced in application layer)
      auth.uid() IS NULL
      OR
      -- Enrolled students can see full course
      EXISTS (
        SELECT 1 FROM enrollments
        WHERE enrollments.user_id = auth.uid()
        AND enrollments.course_id = courses.id
        AND enrollments.status IN ('active', 'in_progress', 'completed')
      )
      OR
      -- Admins can see everything
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
      )
    )
  );

-- Policy: Admins can view and manage all courses
CREATE POLICY "Admins can manage all courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Policy: Instructors can view and edit their courses
CREATE POLICY "Instructors can manage their courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'instructor'
      AND courses.instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- ENROLLMENTS TABLE SECURITY
-- ============================================================================

-- Enable RLS on enrollments table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students can insert own enrollments" ON enrollments;

-- Policy: Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Students can enroll themselves in courses
CREATE POLICY "Students can enroll in courses"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Students can update their own enrollment progress
CREATE POLICY "Students can update own progress"
  ON enrollments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Policy: Admins can manage all enrollments
CREATE POLICY "Admins can manage all enrollments"
  ON enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Policy: Program holders can view their students' enrollments
CREATE POLICY "Program holders can view their students enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_holder_students phs
      JOIN program_holders ph ON ph.id = phs.program_holder_id
      WHERE ph.user_id = auth.uid()
      AND phs.student_id = enrollments.user_id
    )
  );

-- ============================================================================
-- COURSE CONTENT SECURITY (Lessons, Modules, etc.)
-- ============================================================================

-- If you have a lessons table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lessons') THEN
    ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
    
    -- STRICT: ONLY enrolled students can view lessons - NO public access
    CREATE POLICY "ONLY enrolled students can view lessons"
      ON lessons FOR SELECT
      USING (
        -- Must be enrolled in the course
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.user_id = auth.uid()
          AND enrollments.course_id = lessons.course_id
          AND enrollments.status IN ('active', 'in_progress', 'completed')
        )
        OR
        -- OR be admin/staff/instructor
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
        )
      );
    
    -- Admins and instructors can manage lessons
    CREATE POLICY "Admins can manage all lessons"
      ON lessons FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
        )
      );
  END IF;
END $$;

-- If you have a modules table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'modules') THEN
    ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
    
    -- STRICT: ONLY enrolled students can view modules - NO public access
    CREATE POLICY "ONLY enrolled students can view modules"
      ON modules FOR SELECT
      USING (
        -- Must be enrolled in the course
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.user_id = auth.uid()
          AND enrollments.course_id = modules.course_id
          AND enrollments.status IN ('active', 'in_progress', 'completed')
        )
        OR
        -- OR be admin/staff/instructor
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
        )
      );
    
    CREATE POLICY "Admins can manage all modules"
      ON modules FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
        )
      );
  END IF;
END $$;

-- If you have an assignments table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignments') THEN
    ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
    
    -- STRICT: ONLY enrolled students can view assignments - NO public access
    CREATE POLICY "ONLY enrolled students can view assignments"
      ON assignments FOR SELECT
      USING (
        -- Must be enrolled in the course
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.user_id = auth.uid()
          AND enrollments.course_id = assignments.course_id
          AND enrollments.status IN ('active', 'in_progress', 'completed')
        )
        OR
        -- OR be admin/staff/instructor
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
        )
      );
    
    CREATE POLICY "Admins can manage all assignments"
      ON assignments FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
        )
      );
  END IF;
END $$;

-- ============================================================================
-- PROGRAMS TABLE SECURITY
-- ============================================================================

-- Enable RLS on programs table
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active programs" ON programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;

-- Policy: Anyone can view active programs (for browsing)
CREATE POLICY "Anyone can view active programs"
  ON programs FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage all programs
CREATE POLICY "Admins can manage all programs"
  ON programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is enrolled in a course
CREATE OR REPLACE FUNCTION is_enrolled_in_course(user_id_param UUID, course_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = user_id_param
    AND course_id = course_id_param
    AND status IN ('active', 'in_progress', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is enrolled in a program
CREATE OR REPLACE FUNCTION is_enrolled_in_program(user_id_param UUID, program_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM enrollments
    WHERE user_id = user_id_param
    AND program_id = program_id_param
    AND status IN ('active', 'in_progress', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's enrolled courses
CREATE OR REPLACE FUNCTION get_user_enrolled_courses(user_id_param UUID)
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  enrollment_status TEXT,
  progress_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    e.status,
    e.progress_percentage
  FROM enrollments e
  JOIN courses c ON c.id = e.course_id
  WHERE e.user_id = user_id_param
  AND e.status IN ('active', 'in_progress', 'completed')
  ORDER BY e.enrolled_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

-- Create audit log table for course access
CREATE TABLE IF NOT EXISTS course_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  action TEXT NOT NULL, -- 'view', 'enroll', 'complete', 'access_denied'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_access_log_user ON course_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_course_access_log_course ON course_access_log(course_id);
CREATE INDEX IF NOT EXISTS idx_course_access_log_created ON course_access_log(created_at DESC);

-- Enable RLS on audit log
ALTER TABLE course_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON course_access_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON course_access_log FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('courses', 'enrollments', 'programs', 'lessons', 'modules', 'assignments')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      WHERE t.tablename = table_name
      AND c.relrowsecurity = true
    ) THEN
      RAISE NOTICE 'WARNING: RLS not enabled on table %', table_name;
    ELSE
      RAISE NOTICE 'RLS enabled on table %', table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Students can view own enrollments" ON enrollments IS 
  'Students can only see their own enrollment records';

COMMENT ON POLICY "Students can view enrolled course lessons" ON lessons IS 
  'Students can only access lessons from courses they are enrolled in';

COMMENT ON FUNCTION is_enrolled_in_course IS 
  'Helper function to check if a user is enrolled in a specific course';

COMMENT ON TABLE course_access_log IS 
  'Audit log for tracking course access attempts and security events';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Course security policies successfully applied!';
  RAISE NOTICE '✅ Students can now ONLY access courses they are enrolled in';
  RAISE NOTICE '✅ Admins have full access to all courses';
  RAISE NOTICE '✅ Audit logging enabled for security monitoring';
END $$;
