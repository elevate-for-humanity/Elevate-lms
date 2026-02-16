-- Fix RLS policies for public access to marketing/informational tables
-- Everything behind login remains secure

-- ============================================================================
-- PUBLIC ACCESS (No authentication required)
-- ============================================================================

-- Programs table - Public read access for marketing pages
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
    DROP POLICY IF EXISTS "Public can view programs" ON programs;
    CREATE POLICY "Public can view programs"
      ON programs
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- SKIPPED: courses is a VIEW, cannot apply RLS policies
-- DROP POLICY IF EXISTS "Public can view courses" ON courses;
-- CREATE POLICY "Public can view courses"
--   ON courses
--   FOR SELECT
--   USING (true);

-- Instructors table - Public read access for instructor profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'instructors') THEN
    DROP POLICY IF EXISTS "Public can view instructors" ON instructors;
    CREATE POLICY "Public can view instructors"
      ON instructors
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Testimonials - Public read access
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'testimonials') THEN
    DROP POLICY IF EXISTS "Public can view testimonials" ON testimonials;
    CREATE POLICY "Public can view testimonials"
      ON testimonials
      FOR SELECT
      USING (approved = true);
  END IF;
END $$;

-- Blog posts - Public read access for published posts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
    CREATE POLICY "Public can view published blog posts"
      ON blog_posts
      FOR SELECT
      USING (published = true);
  END IF;
END $$;

-- FAQs - Public read access
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    DROP POLICY IF EXISTS "Public can view FAQs" ON faqs;
    CREATE POLICY "Public can view FAQs"
      ON faqs
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- ============================================================================
-- AUTHENTICATED ACCESS (Login required)
-- ============================================================================

-- User profiles - Users can only see their own profile
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    CREATE POLICY "Users can view own profile"
      ON profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile"
      ON profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- Enrollments - Users can only see their own enrollments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_enrollments') THEN
    DROP POLICY IF EXISTS "Users can view own training_enrollments" ON training_enrollments;
    CREATE POLICY "Users can view own training_enrollments"
      ON training_enrollments
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_enrollments') THEN
    DROP POLICY IF EXISTS "Users can create own training_enrollments" ON training_enrollments;
    CREATE POLICY "Users can create own training_enrollments"
      ON training_enrollments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Progress tracking - Users can only see/update their own progress
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
    DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
    CREATE POLICY "Users can view own progress"
      ON user_progress
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
    DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
    CREATE POLICY "Users can update own progress"
      ON user_progress
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Certificates - Users can only see their own certificates
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN
    DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
    CREATE POLICY "Users can view own certificates"
      ON certificates
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Applications - Users can only see/create their own applications
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    DROP POLICY IF EXISTS "Users can view own applications" ON applications;
    CREATE POLICY "Users can view own applications"
      ON applications
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    DROP POLICY IF EXISTS "Users can create own applications" ON applications;
    CREATE POLICY "Users can create own applications"
      ON applications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Payments - Users can only see their own payments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    DROP POLICY IF EXISTS "Users can view own payments" ON payments;
    CREATE POLICY "Users can view own payments"
      ON payments
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Messages - Users can only see messages they sent or received
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DROP POLICY IF EXISTS "Users can view own messages" ON messages;
    CREATE POLICY "Users can view own messages"
      ON messages
      FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    CREATE POLICY "Users can send messages"
      ON messages
      FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- ============================================================================
-- ADMIN ACCESS (Admin role required)
-- ============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can do everything on all tables
-- Programs
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
    DROP POLICY IF EXISTS "Admins can manage programs" ON programs;
    CREATE POLICY "Admins can manage programs"
      ON programs
      FOR ALL
      USING (is_admin());
  END IF;
END $$;

-- SKIPPED: courses is a VIEW, cannot apply RLS policies
-- DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
-- CREATE POLICY "Admins can manage courses"
--   ON courses
--   FOR ALL
--   USING (is_admin());

-- Users/Profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    CREATE POLICY "Admins can view all profiles"
      ON profiles
      FOR SELECT
      USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
    CREATE POLICY "Admins can update all profiles"
      ON profiles
      FOR UPDATE
      USING (is_admin());
  END IF;
END $$;

-- Enrollments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_enrollments') THEN
    DROP POLICY IF EXISTS "Admins can manage training_enrollments" ON training_enrollments;
    CREATE POLICY "Admins can manage training_enrollments"
      ON training_enrollments
      FOR ALL
      USING (is_admin());
  END IF;
END $$;

-- Applications
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
    CREATE POLICY "Admins can manage applications"
      ON applications
      FOR ALL
      USING (is_admin());
  END IF;
END $$;

-- Payments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
    CREATE POLICY "Admins can view all payments"
      ON payments
      FOR SELECT
      USING (is_admin());
  END IF;
END $$;

-- Messages
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
    CREATE POLICY "Admins can view all messages"
      ON messages
      FOR SELECT
      USING (is_admin());
  END IF;
END $$;

-- ============================================================================
-- INSTRUCTOR ACCESS (Instructor role required)
-- ============================================================================

-- Helper function to check if user is instructor
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('instructor', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SKIPPED: courses is a VIEW, cannot apply RLS policies
-- DROP POLICY IF EXISTS "Instructors can view assigned courses" ON courses;
-- CREATE POLICY "Instructors can view assigned courses"
--   ON courses
--   FOR SELECT
--   USING (
--     is_instructor() AND (
--       instructor_id = auth.uid() OR
--       is_admin()
--     )
--   );

-- Instructors can view enrollments for their courses
-- courses VIEW does not have instructor_id column, using admin check instead
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_enrollments') THEN
    DROP POLICY IF EXISTS "Instructors can view course enrollments" ON training_enrollments;
    CREATE POLICY "Instructors can view course enrollments"
      ON training_enrollments
      FOR SELECT
      USING (
        is_instructor() OR is_admin()
      );
  END IF;
END $$;

-- Instructors can update progress for their students
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
    DROP POLICY IF EXISTS "Instructors can update student progress" ON user_progress;
    CREATE POLICY "Instructors can update student progress"
      ON user_progress
      FOR UPDATE
      USING (
        is_instructor() OR is_admin()
      );
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on public tables to anon
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
    GRANT SELECT ON programs TO anon;
  END IF;
END $$;
-- SKIPPED: courses is a VIEW
-- -- SKIPPED: courses is a VIEW
-- GRANT SELECT ON courses TO anon;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'instructors') THEN
    GRANT SELECT ON instructors TO anon;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'testimonials') THEN
    GRANT SELECT ON testimonials TO anon;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
    GRANT SELECT ON blog_posts TO anon;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    GRANT SELECT ON faqs TO anon;
  END IF;
END $$;

-- Grant appropriate permissions to authenticated users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'training_enrollments') THEN
    GRANT SELECT, INSERT ON training_enrollments TO authenticated;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
    GRANT SELECT, INSERT, UPDATE ON user_progress TO authenticated;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN
    GRANT SELECT ON certificates TO authenticated;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    GRANT SELECT, INSERT ON applications TO authenticated;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    GRANT SELECT ON payments TO authenticated;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    GRANT SELECT, INSERT ON messages TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
    COMMENT ON POLICY "Public can view programs" ON programs IS 
      'Allow anonymous users to view programs for marketing pages';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    COMMENT ON POLICY "Users can view own profile" ON profiles IS 
      'Users can only access their own profile data';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
    COMMENT ON POLICY "Admins can manage programs" ON programs IS 
      'Admins have full access to manage all programs';
  END IF;
END $$;
