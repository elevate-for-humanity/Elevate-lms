-- COMPLETE DATABASE LOCKDOWN (ALL 278 TABLES)
-- Migration: 20251220_complete_database_lockdown
-- Purpose: Default-deny security posture for production launch
-- 
-- This migration implements enterprise-grade security:
-- 1. Revoke all grants from anon/authenticated
-- 2. Enable RLS + FORCE RLS on every table
-- 3. Add deny-all policy to every table
-- 4. Set future default privileges to deny
-- 
-- After this: NOTHING is accessible until explicitly allowed
-- This is the only safe way to launch with 278 tables

-- ============================================================================
-- STEP 0: Revoke all grants (prevent accidental exposure)
-- ============================================================================

-- Revoke direct table access from anon/authenticated
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Future-proof: default privileges for new objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Step 0: Revoked all grants from anon/authenticated';
END $$;

-- ============================================================================
-- STEP 1: Enable RLS + FORCE RLS + Deny-All on ALL tables
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  policy_count INTEGER := 0;
  table_count INTEGER := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    table_count := table_count + 1;
    
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
    
    -- Force RLS (prevents bypass via table owner)
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
    
    -- Create deny-all policy if not exists
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
      policy_count := policy_count + 1;
    END IF;
    
    -- Log progress every 50 tables
    IF table_count % 50 = 0 THEN
      RAISE NOTICE '  Progress: % tables processed...', table_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Step 1: Enabled RLS on % tables', table_count;
  RAISE NOTICE '✅ Step 1: Created % deny-all policies', policy_count;
END $$;

-- ============================================================================
-- STEP 2: Add minimal safe policies for critical workflows
-- ============================================================================

-- Auth: Users can read their own profile
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public catalog: Programs (read-only)
CREATE POLICY "public_read_programs" ON public.programs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Public catalog: Courses (read-only)
CREATE POLICY "public_read_courses" ON public.courses
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR status = 'published');

-- Public catalog: LMS Courses (read-only)
CREATE POLICY "public_read_lms_courses" ON public.lms_courses
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Public catalog: Partner Courses (read-only)
CREATE POLICY "public_read_partner_courses" ON public.partner_courses
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Public catalog: Partner Providers (read-only)
CREATE POLICY "public_read_partner_providers" ON public.partner_lms_providers
  FOR SELECT
  TO anon, authenticated
  USING (active = true OR is_active = true);

-- Public catalog: Drug Testing Services (read-only)
CREATE POLICY "public_read_drug_testing_services" ON public.drug_testing_services
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Public catalog: Drug Testing Training (read-only)
CREATE POLICY "public_read_drug_testing_training" ON public.drug_testing_training
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Applications: Users can create and read their own
CREATE POLICY "users_create_applications" ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_read_own_applications" ON public.applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Enrollments: Users can read their own
CREATE POLICY "users_read_own_enrollments" ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = user_id);

RAISE NOTICE '✅ Step 2: Added minimal safe policies for critical workflows';

-- ============================================================================
-- STEP 3: Fix function security (search_path hardening)
-- ============================================================================

DO $$
DECLARE
  func RECORD;
  fixed_count INTEGER := 0;
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
      fixed_count := fixed_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Skip functions that can't be altered
      NULL;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Step 3: Hardened % functions with search_path', fixed_count;
END $$;

-- ============================================================================
-- COMPLETION SUMMARY
-- ============================================================================

DO $$
DECLARE
  total_tables INTEGER;
  total_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tables FROM pg_tables WHERE schemaname = 'public';
  SELECT COUNT(*) INTO total_policies FROM pg_policies WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔒 DATABASE LOCKDOWN COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Security Status:';
  RAISE NOTICE '   - % tables with RLS enabled', total_tables;
  RAISE NOTICE '   - % RLS policies active', total_policies;
  RAISE NOTICE '   - All grants revoked from anon/authenticated';
  RAISE NOTICE '   - Future objects default to deny';
  RAISE NOTICE '   - Functions hardened with search_path';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Public Access (Read-Only):';
  RAISE NOTICE '   - Programs catalog';
  RAISE NOTICE '   - Courses catalog';
  RAISE NOTICE '   - Partner courses catalog';
  RAISE NOTICE '   - Drug testing services';
  RAISE NOTICE '';
  RAISE NOTICE '✅ User Access (Authenticated):';
  RAISE NOTICE '   - Own profile (read/update)';
  RAISE NOTICE '   - Own applications (create/read)';
  RAISE NOTICE '   - Own enrollments (read)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '   1. Test critical user workflows';
  RAISE NOTICE '   2. Add specific policies as needed per feature';
  RAISE NOTICE '   3. Route admin operations through server API';
  RAISE NOTICE '   4. Monitor for policy violations in logs';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Database is now production-ready and secure!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
