-- ============================================================================
-- SECURITY LOCKDOWN - LAUNCH READY (SAFE VERSION)
-- Fixes: avoids tables that don't exist (ex: public.resources)
-- ============================================================================
-- What this does:
-- 1) Revoke default privileges for anon/authenticated
-- 2) Enable RLS + FORCE RLS on all public tables
-- 3) Create deny_all policy on all public tables
-- 4) Open only what you need for Day-1 launch
-- ============================================================================

-- ============================================================================
-- STEP 1: REVOKE ALL ACCIDENTAL ACCESS (PUBLIC SCHEMA)
-- ============================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- ============================================================================
-- STEP 2: ENABLE RLS + DENY ALL ON EVERY PUBLIC TABLE
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
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY;', r.schemaname, r.tablename);

    -- remove and recreate deny_all (safe idempotent)
    EXECUTE format('DROP POLICY IF EXISTS deny_all ON %I.%I;', r.schemaname, r.tablename);
    EXECUTE format(
      'CREATE POLICY deny_all ON %I.%I FOR ALL TO public USING (false) WITH CHECK (false);',
      r.schemaname, r.tablename
    );
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: PUBLIC READ ACCESS (CATALOG TABLES ONLY) - ONLY IF THEY EXIST
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.programs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS public_read_programs ON public.programs;';
    EXECUTE 'CREATE POLICY public_read_programs ON public.programs FOR SELECT TO anon, authenticated USING (true);';
  END IF;

  IF to_regclass('public.credentials') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS public_read_credentials ON public.credentials;';
    EXECUTE 'CREATE POLICY public_read_credentials ON public.credentials FOR SELECT TO anon, authenticated USING (true);';
  END IF;

  IF to_regclass('public.credentialing_partners') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS public_read_credentialing_partners ON public.credentialing_partners;';
    EXECUTE 'CREATE POLICY public_read_credentialing_partners ON public.credentialing_partners FOR SELECT TO anon, authenticated USING (true);';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: STUDENT DAY-1 POLICIES (ONLY IF TABLES EXIST)
-- ============================================================================

-- 4A) APPLICATIONS: anyone can submit, ONLY admins can read/update
DO $$
BEGIN
  IF to_regclass('public.applications') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS anyone_insert_applications ON public.applications;';
    EXECUTE 'CREATE POLICY anyone_insert_applications ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);';

    -- Admin read
    EXECUTE 'DROP POLICY IF EXISTS admins_view_applications ON public.applications;';
    EXECUTE $p$
      CREATE POLICY admins_view_applications
      ON public.applications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin')
        )
      );
    $p$;

    -- Admin update
    EXECUTE 'DROP POLICY IF EXISTS admins_update_applications ON public.applications;';
    EXECUTE $p$
      CREATE POLICY admins_update_applications
      ON public.applications
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin')
        )
      );
    $p$;
  END IF;
END $$;

-- 4B) PROFILES: user reads/updates own, admins read all
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS users_read_own_profile ON public.profiles;';
    EXECUTE 'CREATE POLICY users_read_own_profile ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS users_update_own_profile ON public.profiles;';
    EXECUTE 'CREATE POLICY users_update_own_profile ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS admins_read_all_profiles ON public.profiles;';
    EXECUTE $p$
      CREATE POLICY admins_read_all_profiles
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin','super_admin')
        )
      );
    $p$;
  END IF;
END $$;

-- 4C) ENROLLMENTS: students see/insert own, admins manage all
DO $$
BEGIN
  IF to_regclass('public.enrollments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS students_read_own_enrollments ON public.enrollments;';
    EXECUTE 'CREATE POLICY students_read_own_enrollments ON public.enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS students_insert_own_enrollments ON public.enrollments;';
    EXECUTE 'CREATE POLICY students_insert_own_enrollments ON public.enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS admins_manage_enrollments ON public.enrollments;';
    EXECUTE $p$
      CREATE POLICY admins_manage_enrollments
      ON public.enrollments
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin','instructor','staff')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin','instructor','staff')
        )
      );
    $p$;
  END IF;
END $$;

-- 4D) USER PROGRESS: student owns row by user_id
DO $$
BEGIN
  IF to_regclass('public.user_progress') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS students_manage_own_progress ON public.user_progress;';
    EXECUTE 'CREATE POLICY students_manage_own_progress ON public.user_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS admins_view_all_progress ON public.user_progress;';
    EXECUTE $p$
      CREATE POLICY admins_view_all_progress
      ON public.user_progress
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin','instructor','staff')
        )
      );
    $p$;
  END IF;
END $$;

-- 4E) QUIZ ATTEMPTS
DO $$
BEGIN
  IF to_regclass('public.quiz_attempts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS students_manage_own_quiz_attempts ON public.quiz_attempts;';
    EXECUTE 'CREATE POLICY students_manage_own_quiz_attempts ON public.quiz_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS admins_view_all_quiz_attempts ON public.quiz_attempts;';
    EXECUTE $p$
      CREATE POLICY admins_view_all_quiz_attempts
      ON public.quiz_attempts
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin','instructor','staff')
        )
      );
    $p$;
  END IF;
END $$;

-- 4F) LEARNING PATHS (student read own, admins manage)
DO $$
BEGIN
  IF to_regclass('public.learning_paths') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS students_read_own_learning_paths ON public.learning_paths;';
    EXECUTE 'CREATE POLICY students_read_own_learning_paths ON public.learning_paths FOR SELECT TO authenticated USING (user_id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS admins_manage_learning_paths ON public.learning_paths;';
    EXECUTE $p$
      CREATE POLICY admins_manage_learning_paths
      ON public.learning_paths
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin','instructor','staff')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin','instructor','staff')
        )
      );
    $p$;
  END IF;
END $$;

-- 4G) CREDENTIALS ATTAINED (student read own, admins manage)
DO $$
BEGIN
  IF to_regclass('public.credentials_attained') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS students_read_own_credentials_attained ON public.credentials_attained;';
    EXECUTE 'CREATE POLICY students_read_own_credentials_attained ON public.credentials_attained FOR SELECT TO authenticated USING (user_id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS admins_manage_credentials_attained ON public.credentials_attained;';
    EXECUTE $p$
      CREATE POLICY admins_manage_credentials_attained
      ON public.credentials_attained
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin')
        )
      );
    $p$;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: COURSE COMPLETION STATUS (CREATE ONLY IF public.courses EXISTS)
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.courses') IS NOT NULL THEN

    EXECUTE $sql$
      CREATE TABLE IF NOT EXISTS public.course_completion_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
        enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,

        status TEXT NOT NULL DEFAULT 'not_started'
          CHECK (status IN ('not_started','in_progress','completed','failed')),
        completion_percentage INTEGER DEFAULT 0
          CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
        completed_at TIMESTAMPTZ,

        source TEXT NOT NULL
          CHECK (source IN ('scorm','partner_lms','manual_override','system')),
        last_sync_at TIMESTAMPTZ DEFAULT NOW(),

        partner_course_id TEXT,
        partner_completion_data JSONB,
        notes TEXT,

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),

        UNIQUE(user_id, course_id)
      );
    $sql$;

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_course_completion_user ON public.course_completion_status(user_id);';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_course_completion_course ON public.course_completion_status(course_id);';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_course_completion_status ON public.course_completion_status(status);';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_course_completion_enrollment ON public.course_completion_status(enrollment_id);';

    EXECUTE 'ALTER TABLE public.course_completion_status ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'ALTER TABLE public.course_completion_status FORCE ROW LEVEL SECURITY;';

    EXECUTE 'DROP POLICY IF EXISTS students_read_own_completion ON public.course_completion_status;';
    EXECUTE 'CREATE POLICY students_read_own_completion ON public.course_completion_status FOR SELECT TO authenticated USING (user_id = auth.uid());';

    EXECUTE 'DROP POLICY IF EXISTS admins_manage_completion ON public.course_completion_status;';
    EXECUTE $p$
      CREATE POLICY admins_manage_completion
      ON public.course_completion_status
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin','instructor','staff')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin','super_admin','instructor','staff')
        )
      );
    $p$;

    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.update_course_completion_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    $fn$;

    EXECUTE 'DROP TRIGGER IF EXISTS update_course_completion_timestamp ON public.course_completion_status;';
    EXECUTE 'CREATE TRIGGER update_course_completion_timestamp BEFORE UPDATE ON public.course_completion_status FOR EACH ROW EXECUTE FUNCTION public.update_course_completion_timestamp();';

    EXECUTE $$comment$
      COMMENT ON TABLE public.course_completion_status IS
      'Single source of truth for course completion. Updated by SCORM sync, partner LMS webhooks, or manual admin override.';
    $comment$;

  END IF;
END $$;

-- ============================================================================
-- FINAL CONFIRMATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Security lockdown complete (safe version)';
  RAISE NOTICE '✅ RLS enabled + deny_all applied to all public tables';
  RAISE NOTICE '✅ Public read opened for catalog tables that exist';
  RAISE NOTICE '✅ Day-1 student/admin policies applied (where tables exist)';
  RAISE NOTICE '✅ course_completion_status created (only if public.courses exists)';
  RAISE NOTICE '🔒 Database is now launch-ready';
END $$;
