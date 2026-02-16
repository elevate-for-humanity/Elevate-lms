-- COMPLETE DATABASE LOCKDOWN - SIMPLIFIED VERSION
-- No RAISE NOTICE statements to avoid syntax issues

-- ============================================================================
-- STEP 0: Revoke all grants
-- ============================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- ============================================================================
-- STEP 1: Enable RLS + FORCE RLS + Deny-All on ALL tables
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
    
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = r.schemaname
        AND tablename = r.tablename
        AND policyname = 'deny_all_default'
    ) THEN
      EXECUTE format($sql$
        CREATE POLICY deny_all_default
        ON %I.%I
        FOR ALL
        TO public
        USING (false)
        WITH CHECK (false);
      $sql$, r.schemaname, r.tablename);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Add minimal safe policies for Day 1 launch
-- ============================================================================

-- Profiles: Users can read/update their own
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Programs: Public read
CREATE POLICY "public_read_programs" ON public.programs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Courses: Public read
CREATE POLICY "public_read_courses" ON public.courses
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR status = 'published');

-- LMS Courses: Public read
CREATE POLICY "public_read_lms_courses" ON public.lms_courses
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Partner Courses: Public read
CREATE POLICY "public_read_partner_courses" ON public.partner_courses
  FOR SELECT TO anon, authenticated
  USING (active = true);

-- Partner Providers: Public read
CREATE POLICY "public_read_partner_providers" ON public.partner_lms_providers
  FOR SELECT TO anon, authenticated
  USING (active = true OR is_active = true);

-- Drug Testing Services: Public read
CREATE POLICY "public_read_drug_testing_services" ON public.drug_testing_services
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Drug Testing Training: Public read
CREATE POLICY "public_read_drug_testing_training" ON public.drug_testing_training
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Applications: Users can create and read their own
CREATE POLICY "users_create_applications" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_read_own_applications" ON public.applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Enrollments: Users can read their own
CREATE POLICY "users_read_own_enrollments" ON public.enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = user_id);

-- ============================================================================
-- STEP 3: Harden functions
-- ============================================================================

DO $$
DECLARE
  func RECORD;
BEGIN
  FOR func IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
        func.schema_name,
        func.function_name,
        func.args
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;
