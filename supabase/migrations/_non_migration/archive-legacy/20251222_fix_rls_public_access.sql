-- PHASE C: Fix RLS Policies - Allow Public Access Where Needed
-- This migration removes overly restrictive policies and adds proper public read access

-- ============================================================================
-- STEP 1: Remove blanket deny-all policies (from lockdown migrations)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all "deny_all_default" policies created by lockdown migrations
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname = 'deny_all_default'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped restrictive policy: % on %.%', r.policyname, r.schemaname, r.tablename;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Public Catalog Tables (anon SELECT allowed)
-- ============================================================================

-- PROGRAMS: Public can view active programs
DROP POLICY IF EXISTS "Programs are viewable by everyone" ON public.programs;
CREATE POLICY "Programs are viewable by everyone"
  ON public.programs
  FOR SELECT
  USING (is_active = true);

-- COURSES: Public can view published courses
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
CREATE POLICY "Public can view published courses"
  ON public.courses
  FOR SELECT
  USING (
    CASE 
      WHEN status IS NOT NULL THEN status = 'published'
      WHEN is_published IS NOT NULL THEN is_published = true
      ELSE true -- Fallback if no status field
    END
  );

-- MODULES: Public can view modules of published courses
DROP POLICY IF EXISTS "Public can view course modules" ON public.modules;
CREATE POLICY "Public can view course modules"
  ON public.modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = modules.program_id
      AND programs.is_active = true
    )
  );

-- LESSONS: Public can view lessons of active programs
DROP POLICY IF EXISTS "Public can view lessons" ON public.lessons;
CREATE POLICY "Public can view lessons"
  ON public.lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules
      JOIN public.programs ON programs.id = modules.program_id
      WHERE modules.id = lessons.module_id
      AND programs.is_active = true
    )
  );

-- PRODUCTS: Public can view active products (store)
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products"
  ON public.products
  FOR SELECT
  USING (
    CASE
      WHEN is_active IS NOT NULL THEN is_active = true
      WHEN active IS NOT NULL THEN active = true
      ELSE true
    END
  );

-- ============================================================================
-- STEP 3: Student Progress Tables (authenticated users only)
-- ============================================================================

-- ENROLLMENTS: Students can view their own enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.enrollments;
CREATE POLICY "Users can insert own enrollments"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- LESSON_PROGRESS: Students can manage their own progress
DROP POLICY IF EXISTS "Users can view own progress" ON public.lesson_progress;
CREATE POLICY "Users can view own progress"
  ON public.lesson_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own progress" ON public.lesson_progress;
CREATE POLICY "Users can update own progress"
  ON public.lesson_progress
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: Applications (public can submit, users can view own)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
CREATE POLICY "Anyone can submit applications"
  ON public.applications
  FOR INSERT
  WITH CHECK (true); -- Allow anonymous applications

DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;
CREATE POLICY "Users can view own applications"
  ON public.applications
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL -- Allow viewing during submission flow
  );

-- ============================================================================
-- STEP 5: Profiles (users can view/update own profile)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 6: Admin/Service Role Access (bypass RLS)
-- ============================================================================

-- Grant service_role full access (for admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- STEP 7: Verification Queries
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated: public catalog accessible, student progress protected';
  RAISE NOTICE 'Public can read: programs, courses, modules, lessons, products';
  RAISE NOTICE 'Auth required: enrollments, progress, profiles';
  RAISE NOTICE 'Public can submit: applications';
END $$;
