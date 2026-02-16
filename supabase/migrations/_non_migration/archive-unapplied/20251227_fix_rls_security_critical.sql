-- ============================================
-- CRITICAL SECURITY FIX: Remove Broken RLS Policies
-- ============================================
-- The "deny_all" policies are PERMISSIVE which means they ALLOW access
-- This is a critical security vulnerability affecting almost every table

-- Drop all broken deny_all policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname = 'deny_all'
      AND permissive = 'PERMISSIVE'
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
    RAISE NOTICE 'Dropped broken policy: % on %', pol.policyname, pol.tablename;
  END LOOP;
END $$;

-- ============================================
-- PROPER RLS POLICIES FOR CRITICAL TABLES
-- ============================================

-- profiles: Users can only see/edit their own profile, admins see all
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;

CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "admins_read_all_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- marketplace_creators: Only approved creators visible, users manage own
DROP POLICY IF EXISTS "public_view_approved_creators" ON marketplace_creators;
DROP POLICY IF EXISTS "creators_manage_own" ON marketplace_creators;

CREATE POLICY "public_view_approved_creators" ON marketplace_creators
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "creators_manage_own" ON marketplace_creators
  FOR ALL
  USING (user_id = auth.uid());

-- marketplace_products: Only approved products visible, creators manage own
DROP POLICY IF EXISTS "public_view_approved_products" ON marketplace_products;
DROP POLICY IF EXISTS "creators_manage_own_products" ON marketplace_products;

CREATE POLICY "public_view_approved_products" ON marketplace_products
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "creators_manage_own_products" ON marketplace_products
  FOR ALL
  USING (
    creator_id IN (
      SELECT id FROM marketplace_creators WHERE user_id = auth.uid()
    )
  );

-- marketplace_sales: Creators see own sales, buyers access via token
DROP POLICY IF EXISTS "creators_view_own_sales" ON marketplace_sales;
DROP POLICY IF EXISTS "buyers_access_via_token" ON marketplace_sales;

CREATE POLICY "creators_view_own_sales" ON marketplace_sales
  FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM marketplace_creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "buyers_access_via_token" ON marketplace_sales
  FOR SELECT
  USING (download_token IS NOT NULL);

-- program_holder_documents: Users see own, admins see all
DROP POLICY IF EXISTS "users_manage_own_documents" ON program_holder_documents;
DROP POLICY IF EXISTS "admins_view_all_documents" ON program_holder_documents;

CREATE POLICY "users_manage_own_documents" ON program_holder_documents
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "admins_view_all_documents" ON program_holder_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- program_holder_verification: Users see own, admins see all
DROP POLICY IF EXISTS "users_view_own_verification" ON program_holder_verification;
DROP POLICY IF EXISTS "admins_manage_verification" ON program_holder_verification;

CREATE POLICY "users_view_own_verification" ON program_holder_verification
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_manage_verification" ON program_holder_verification
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- program_holder_banking: HIGHLY SENSITIVE - Users see own only, admins see all
DROP POLICY IF EXISTS "users_manage_own_banking" ON program_holder_banking;
DROP POLICY IF EXISTS "admins_view_banking" ON program_holder_banking;

CREATE POLICY "users_manage_own_banking" ON program_holder_banking
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "admins_view_banking" ON program_holder_banking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- program_holders: Users see own, admins see all
DROP POLICY IF EXISTS "users_view_own_holder" ON program_holders;
DROP POLICY IF EXISTS "admins_view_all_holders" ON program_holders;

CREATE POLICY "users_view_own_holder" ON program_holders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_view_all_holders" ON program_holders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- RESTRICTIVE POLICIES FOR SENSITIVE TABLES
-- ============================================

-- Tables that should have NO public access at all
DO $$
DECLARE
  sensitive_table TEXT;
  sensitive_tables TEXT[] := ARRAY[
    'api_keys',
    'api_request_logs',
    'failed_login_attempts',
    'ferpa_access_log',
    'direct_deposit_accounts',
    'employee_documents',
    'payroll_records'
  ];
BEGIN
  FOREACH sensitive_table IN ARRAY sensitive_tables
  LOOP
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = sensitive_table AND schemaname = 'public') THEN
      -- Drop all existing policies
      EXECUTE format('DROP POLICY IF EXISTS "admin_only_access" ON %I', sensitive_table);
      
      -- Create admin-only policy
      EXECUTE format('
        CREATE POLICY "admin_only_access" ON %I
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN (''admin'', ''super_admin'')
          )
        )', sensitive_table);
      
      RAISE NOTICE 'Secured table: %', sensitive_table;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Create view to check RLS status
CREATE OR REPLACE VIEW rls_security_status AS
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count,
  ARRAY_AGG(p.policyname) FILTER (WHERE p.policyname IS NOT NULL) as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'profiles', 'applications', 'enrollments',
    'marketplace_creators', 'marketplace_products', 'marketplace_sales',
    'program_holders', 'program_holder_documents', 
    'program_holder_verification', 'program_holder_banking'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

COMMENT ON VIEW rls_security_status IS 'Shows RLS status for critical tables';
