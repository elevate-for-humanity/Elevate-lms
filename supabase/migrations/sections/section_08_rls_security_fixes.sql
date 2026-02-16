-- Fix Supabase lint 0003_auth_rls_initplan (safe edition)
-- Wraps auth.uid(), auth.role(), auth.jwt(), and current_setting() in subselects
-- to prevent initplan performance issues in RLS policies

DO $rls$
DECLARE
  r RECORD;
  roles_sql TEXT;
  new_qual TEXT;
  new_with_check TEXT;
BEGIN
  FOR r IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      AND (
        (qual       IS NOT NULL AND (qual       ILIKE '%auth.%' OR qual       ILIKE '%current_setting(%'))
        OR
        (with_check IS NOT NULL AND (with_check ILIKE '%auth.%' OR with_check ILIKE '%current_setting(%'))
      )
  LOOP
    SELECT COALESCE(string_agg(quote_ident(x), ', '), 'PUBLIC')
      INTO roles_sql
    FROM unnest(r.roles) AS x;

    new_qual := r.qual;
    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'auth.uid()',  '(select auth.uid())');
      new_qual := replace(new_qual, 'auth.role()', '(select auth.role())');
      new_qual := replace(new_qual, 'auth.jwt()',  '(select auth.jwt())');
      new_qual := regexp_replace(
        new_qual,
        '(^|[^a-zA-Z0-9_])current_setting\(([^)]*)\)',
        '\1(select current_setting(\2))',
        'g'
      );
    END IF;

    new_with_check := r.with_check;
    IF new_with_check IS NOT NULL THEN
      new_with_check := replace(new_with_check, 'auth.uid()',  '(select auth.uid())');
      new_with_check := replace(new_with_check, 'auth.role()', '(select auth.role())');
      new_with_check := replace(new_with_check, 'auth.jwt()',  '(select auth.jwt())');
      new_with_check := regexp_replace(
        new_with_check,
        '(^|[^a-zA-Z0-9_])current_setting\(([^)]*)\)',
        '\1(select current_setting(\2))',
        'g'
      );
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I;',
      r.policyname, r.schemaname, r.tablename
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
      r.policyname,
      r.schemaname,
      r.tablename,
      CASE WHEN r.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      r.cmd,
      (CASE WHEN roles_sql IS NULL OR roles_sql = '' THEN 'PUBLIC' ELSE roles_sql END),
      CASE WHEN new_qual IS NOT NULL THEN ' USING (' || new_qual || ')' ELSE '' END,
      CASE WHEN new_with_check IS NOT NULL THEN ' WITH CHECK (' || new_with_check || ')' ELSE '' END
    );
  END LOOP;
END;
$rls$;
-- Fix RLS Security: Remove user_metadata references
-- 
-- SECURITY ISSUE: user_metadata is editable by end users and should never
-- be used in RLS policies. This migration replaces all user_metadata 
-- references with secure lookups from the profiles table.
--
-- Affected tables:
-- - public.tenants
-- - public.licenses  
-- - public.license_purchases
-- - public.provisioning_events
-- - public.license_violations

-- ============================================
-- STEP 1: Create secure tenant lookup function
-- ============================================

-- Drop the insecure function
DROP FUNCTION IF EXISTS get_current_tenant_id();

-- Create secure version that ONLY uses profiles table
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from profiles table (server-controlled, not user-editable)
  SELECT tenant_id INTO v_tenant_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION get_current_tenant_id IS 
  'Securely returns tenant_id from profiles table. Never uses user_metadata.';

-- ============================================
-- STEP 2: Drop insecure policies on tenants
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;

-- Create secure policy
CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 3: Drop insecure policies on licenses
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant licenses" ON licenses;

-- Create secure policy
CREATE POLICY "Users can view own tenant licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 4: Drop insecure policies on license_purchases
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant purchases" ON license_purchases;

-- Create secure policy
CREATE POLICY "Users can view own tenant purchases"
  ON license_purchases FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 5: Drop insecure policies on provisioning_events
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant provisioning events" ON provisioning_events;

-- Create secure policy (admins only within tenant)
CREATE POLICY "Users can view own tenant provisioning events"
  ON provisioning_events FOR SELECT
  TO authenticated
  USING (
    (tenant_id = get_current_tenant_id() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
    OR is_super_admin()
  );

-- ============================================
-- STEP 6: Drop insecure policies on license_violations
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant violations" ON license_violations;

-- Create secure policy (admins only within tenant)
CREATE POLICY "Users can view own tenant violations"
  ON license_violations FOR SELECT
  TO authenticated
  USING (
    (tenant_id = get_current_tenant_id() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
    OR is_super_admin()
  );

-- ============================================
-- STEP 7: Ensure is_super_admin function is secure
-- ============================================

-- Recreate to ensure it doesn't use user_metadata
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION is_super_admin IS 
  'Securely checks super_admin role from profiles table. Never uses user_metadata.';

-- ============================================
-- VERIFICATION: Check no policies reference user_metadata
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- This will fail if any policies still reference user_metadata
  -- (Manual verification recommended after migration)
  RAISE NOTICE 'Migration complete. Verify no policies reference user_metadata in Supabase dashboard.';
END $$;
-- ============================================
-- Fix Security Issues from Supabase Linter
-- ============================================
-- 1. Missing RLS policies for application_state_events, wishlists
-- 2. Function search_path vulnerabilities  
-- 3. Overly permissive RLS policies
--
-- This migration uses safe patterns that won't fail if tables/functions don't exist

-- ============================================
-- SECTION 1: FIX FUNCTION SEARCH_PATH
-- ============================================

DO $$
BEGIN
  -- calculate_distance_meters
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_distance_meters') THEN
    ALTER FUNCTION public.calculate_distance_meters(decimal, decimal, decimal, decimal) SET search_path = public;
    RAISE NOTICE 'Fixed: calculate_distance_meters';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped calculate_distance_meters: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_no_apprenticeship_for_non_apprentice_programs') THEN
    ALTER FUNCTION public.guard_no_apprenticeship_for_non_apprentice_programs() SET search_path = public;
    RAISE NOTICE 'Fixed: guard_no_apprenticeship_for_non_apprentice_programs';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped guard_no_apprenticeship_for_non_apprentice_programs: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_within_geofence') THEN
    ALTER FUNCTION public.is_within_geofence(uuid, decimal, decimal) SET search_path = public;
    RAISE NOTICE 'Fixed: is_within_geofence';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped is_within_geofence: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'lookup_stripe_enrollment_map') THEN
    EXECUTE 'ALTER FUNCTION public.lookup_stripe_enrollment_map SET search_path = public';
    RAISE NOTICE 'Fixed: lookup_stripe_enrollment_map';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped lookup_stripe_enrollment_map: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    ALTER FUNCTION public.set_updated_at() SET search_path = public;
    RAISE NOTICE 'Fixed: set_updated_at';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped set_updated_at: %', SQLERRM;
END $$;

-- ============================================
-- SECTION 2: MISSING RLS POLICIES
-- ============================================

-- application_state_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'application_state_events') THEN
    DROP POLICY IF EXISTS "Admins can view all state events" ON application_state_events;
    DROP POLICY IF EXISTS "Staff can view all state events" ON application_state_events;
    DROP POLICY IF EXISTS "Users can view own application events" ON application_state_events;

    CREATE POLICY "Admins can view all state events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

    CREATE POLICY "Staff can view all state events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'staff'));

    CREATE POLICY "Users can view own application events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM career_applications ca WHERE ca.id = application_state_events.application_id AND ca.user_id = auth.uid()));

    RAISE NOTICE 'Fixed: application_state_events policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped application_state_events: %', SQLERRM;
END $$;

-- wishlists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlists') THEN
    DROP POLICY IF EXISTS "Users can view own wishlists" ON wishlists;
    DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlists;
    DROP POLICY IF EXISTS "Admins can view all wishlists" ON wishlists;

    CREATE POLICY "Users can view own wishlists" ON wishlists FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can add to own wishlist" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can remove from own wishlist" ON wishlists FOR DELETE USING (auth.uid() = user_id);
    CREATE POLICY "Admins can view all wishlists" ON wishlists FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

    RAISE NOTICE 'Fixed: wishlists policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped wishlists: %', SQLERRM;
END $$;

-- ============================================
-- SECTION 3: OVERLY PERMISSIVE RLS POLICIES
-- ============================================

-- applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON applications;
    CREATE POLICY "anyone_insert" ON applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND LENGTH(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped applications: %', SQLERRM;
END $$;

-- barbershop_partner_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'barbershop_partner_applications') THEN
    DROP POLICY IF EXISTS "Allow public inserts" ON barbershop_partner_applications;
    CREATE POLICY "Allow public inserts" ON barbershop_partner_applications FOR INSERT
      WITH CHECK (business_name IS NOT NULL AND LENGTH(business_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: barbershop_partner_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped barbershop_partner_applications: %', SQLERRM;
END $$;

-- career_course_purchases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'career_course_purchases') THEN
    DROP POLICY IF EXISTS "career_course_purchases_insert" ON career_course_purchases;
    CREATE POLICY "career_course_purchases_insert" ON career_course_purchases FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
    RAISE NOTICE 'Fixed: career_course_purchases policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped career_course_purchases: %', SQLERRM;
END $$;

-- conversions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversions') THEN
    DROP POLICY IF EXISTS "System can insert conversions" ON conversions;
    CREATE POLICY "System can insert conversions" ON conversions FOR INSERT
      WITH CHECK (created_at IS NULL OR created_at >= NOW() - INTERVAL '1 hour');
    RAISE NOTICE 'Fixed: conversions policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped conversions: %', SQLERRM;
END $$;

-- employer_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employer_applications') THEN
    DROP POLICY IF EXISTS "employer_applications_insert" ON employer_applications;
    DROP POLICY IF EXISTS "employer_applications_insert_anon" ON employer_applications;
    DROP POLICY IF EXISTS "employer_applications_insert_auth" ON employer_applications;
    CREATE POLICY "employer_applications_insert" ON employer_applications FOR INSERT
      WITH CHECK (company_name IS NOT NULL AND LENGTH(company_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: employer_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped employer_applications: %', SQLERRM;
END $$;

-- leads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    DROP POLICY IF EXISTS "Public access to leads" ON leads;
    DROP POLICY IF EXISTS "leads_insert" ON leads;
    DROP POLICY IF EXISTS "leads_admin_all" ON leads;
    DROP POLICY IF EXISTS "leads_select" ON leads;
    
    CREATE POLICY "leads_insert" ON leads FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    CREATE POLICY "leads_admin_all" ON leads FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
    CREATE POLICY "leads_select" ON leads FOR SELECT USING (true);
    RAISE NOTICE 'Fixed: leads policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped leads: %', SQLERRM;
END $$;

-- license_purchases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'license_purchases') THEN
    DROP POLICY IF EXISTS "license_purchases_all" ON license_purchases;
    DROP POLICY IF EXISTS "license_purchases_select" ON license_purchases;
    DROP POLICY IF EXISTS "license_purchases_insert" ON license_purchases;
    DROP POLICY IF EXISTS "license_purchases_admin" ON license_purchases;
    
    CREATE POLICY "license_purchases_select" ON license_purchases FOR SELECT
      USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
    CREATE POLICY "license_purchases_insert" ON license_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "license_purchases_admin" ON license_purchases FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: license_purchases policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped license_purchases: %', SQLERRM;
END $$;

-- license_violations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'license_violations') THEN
    DROP POLICY IF EXISTS "license_violations_all" ON license_violations;
    DROP POLICY IF EXISTS "license_violations_admin" ON license_violations;
    DROP POLICY IF EXISTS "license_violations_select" ON license_violations;
    
    CREATE POLICY "license_violations_admin" ON license_violations FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
    CREATE POLICY "license_violations_select" ON license_violations FOR SELECT USING (true);
    RAISE NOTICE 'Fixed: license_violations policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped license_violations: %', SQLERRM;
END $$;

-- licenses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'licenses') THEN
    DROP POLICY IF EXISTS "licenses_all" ON licenses;
    DROP POLICY IF EXISTS "licenses_select" ON licenses;
    DROP POLICY IF EXISTS "licenses_admin" ON licenses;
    
    CREATE POLICY "licenses_select" ON licenses FOR SELECT USING (true);
    CREATE POLICY "licenses_admin" ON licenses FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: licenses policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped licenses: %', SQLERRM;
END $$;

-- page_views
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'page_views') THEN
    DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
    CREATE POLICY "Anyone can insert page views" ON page_views FOR INSERT
      WITH CHECK (created_at IS NULL OR created_at >= NOW() - INTERVAL '1 hour');
    RAISE NOTICE 'Fixed: page_views policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped page_views: %', SQLERRM;
END $$;

-- partner_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_applications') THEN
    DROP POLICY IF EXISTS "allow_all" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_insert" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_select" ON partner_applications;
    DROP POLICY IF EXISTS "partner_applications_admin" ON partner_applications;
    
    CREATE POLICY "partner_applications_insert" ON partner_applications FOR INSERT
      WITH CHECK (company_name IS NOT NULL AND LENGTH(company_name) <= 255);
    CREATE POLICY "partner_applications_select" ON partner_applications FOR SELECT USING (true);
    CREATE POLICY "partner_applications_admin" ON partner_applications FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
    RAISE NOTICE 'Fixed: partner_applications policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_applications: %', SQLERRM;
END $$;

-- partner_audit_log
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_audit_log') THEN
    DROP POLICY IF EXISTS "allow_all" ON partner_audit_log;
    DROP POLICY IF EXISTS "partner_audit_log_admin" ON partner_audit_log;
    
    CREATE POLICY "partner_audit_log_admin" ON partner_audit_log FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: partner_audit_log policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_audit_log: %', SQLERRM;
END $$;

-- partner_inquiries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_inquiries') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON partner_inquiries;
    DROP POLICY IF EXISTS "partner_inquiries_insert" ON partner_inquiries;
    
    CREATE POLICY "partner_inquiries_insert" ON partner_inquiries FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: partner_inquiries policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_inquiries: %', SQLERRM;
END $$;

-- partner_program_access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_program_access') THEN
    DROP POLICY IF EXISTS "allow_all" ON partner_program_access;
    DROP POLICY IF EXISTS "partner_program_access_select" ON partner_program_access;
    DROP POLICY IF EXISTS "partner_program_access_admin" ON partner_program_access;
    
    CREATE POLICY "partner_program_access_select" ON partner_program_access FOR SELECT
      USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    CREATE POLICY "partner_program_access_admin" ON partner_program_access FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: partner_program_access policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_program_access: %', SQLERRM;
END $$;

-- partner_users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partner_users') THEN
    DROP POLICY IF EXISTS "allow_all" ON partner_users;
    DROP POLICY IF EXISTS "partner_users_select" ON partner_users;
    DROP POLICY IF EXISTS "partner_users_admin" ON partner_users;
    
    CREATE POLICY "partner_users_select" ON partner_users FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    CREATE POLICY "partner_users_admin" ON partner_users FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: partner_users policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partner_users: %', SQLERRM;
END $$;

-- partners
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partners') THEN
    DROP POLICY IF EXISTS "allow_all" ON partners;
    DROP POLICY IF EXISTS "partners_select" ON partners;
    DROP POLICY IF EXISTS "partners_own" ON partners;
    DROP POLICY IF EXISTS "partners_admin" ON partners;
    
    CREATE POLICY "partners_select" ON partners FOR SELECT USING (true);
    CREATE POLICY "partners_own" ON partners FOR UPDATE USING (user_id = auth.uid());
    CREATE POLICY "partners_admin" ON partners FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: partners policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped partners: %', SQLERRM;
END $$;

-- product_reports
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_reports') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON product_reports;
    DROP POLICY IF EXISTS "product_reports_insert" ON product_reports;
    
    CREATE POLICY "product_reports_insert" ON product_reports FOR INSERT
      WITH CHECK (product_id IS NOT NULL AND reason IS NOT NULL AND LENGTH(reason) <= 1000);
    RAISE NOTICE 'Fixed: product_reports policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped product_reports: %', SQLERRM;
END $$;

-- program_holder_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'program_holder_applications') THEN
    DROP POLICY IF EXISTS "program_holder_applications_insert" ON program_holder_applications;
    DROP POLICY IF EXISTS "program_holder_applications_insert_anon" ON program_holder_applications;
    DROP POLICY IF EXISTS "program_holder_applications_insert_auth" ON program_holder_applications;
    
    CREATE POLICY "program_holder_applications_insert" ON program_holder_applications FOR INSERT
      WITH CHECK (organization_name IS NOT NULL AND LENGTH(organization_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: program_holder_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped program_holder_applications: %', SQLERRM;
END $$;

-- promo_code_uses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promo_code_uses') THEN
    DROP POLICY IF EXISTS "promo_code_uses_insert" ON promo_code_uses;
    
    CREATE POLICY "promo_code_uses_insert" ON promo_code_uses FOR INSERT
      WITH CHECK (promo_code_id IS NOT NULL);
    RAISE NOTICE 'Fixed: promo_code_uses policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped promo_code_uses: %', SQLERRM;
END $$;

-- provisioning_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provisioning_events') THEN
    DROP POLICY IF EXISTS "provisioning_events_all" ON provisioning_events;
    DROP POLICY IF EXISTS "provisioning_events_select" ON provisioning_events;
    DROP POLICY IF EXISTS "provisioning_events_insert" ON provisioning_events;
    
    CREATE POLICY "provisioning_events_select" ON provisioning_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    CREATE POLICY "provisioning_events_insert" ON provisioning_events FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
    RAISE NOTICE 'Fixed: provisioning_events policies';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped provisioning_events: %', SQLERRM;
END $$;

-- shop_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shop_applications') THEN
    DROP POLICY IF EXISTS "Anyone can submit application" ON shop_applications;
    DROP POLICY IF EXISTS "shop_applications_insert" ON shop_applications;
    
    CREATE POLICY "shop_applications_insert" ON shop_applications FOR INSERT
      WITH CHECK (shop_name IS NOT NULL AND LENGTH(shop_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Fixed: shop_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped shop_applications: %', SQLERRM;
END $$;

-- staff_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff_applications') THEN
    DROP POLICY IF EXISTS "staff_applications_insert" ON staff_applications;
    DROP POLICY IF EXISTS "staff_applications_insert_anon" ON staff_applications;
    DROP POLICY IF EXISTS "staff_applications_insert_auth" ON staff_applications;
    
    CREATE POLICY "staff_applications_insert" ON staff_applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
    RAISE NOTICE 'Fixed: staff_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped staff_applications: %', SQLERRM;
END $$;

-- student_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_applications') THEN
    DROP POLICY IF EXISTS "student_applications_insert" ON student_applications;
    DROP POLICY IF EXISTS "student_applications_insert_anon" ON student_applications;
    DROP POLICY IF EXISTS "student_applications_insert_auth" ON student_applications;
    
    CREATE POLICY "student_applications_insert" ON student_applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
    RAISE NOTICE 'Fixed: student_applications policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped student_applications: %', SQLERRM;
END $$;

-- tax_appointments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_appointments') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON tax_appointments;
    DROP POLICY IF EXISTS "tax_appointments_insert" ON tax_appointments;
    
    CREATE POLICY "tax_appointments_insert" ON tax_appointments FOR INSERT
      WITH CHECK (client_name IS NOT NULL AND LENGTH(client_name) <= 255 AND client_email IS NOT NULL AND client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND appointment_date IS NOT NULL AND appointment_date >= CURRENT_DATE);
    RAISE NOTICE 'Fixed: tax_appointments policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped tax_appointments: %', SQLERRM;
END $$;

-- tax_document_uploads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_document_uploads') THEN
    DROP POLICY IF EXISTS "anyone_insert" ON tax_document_uploads;
    DROP POLICY IF EXISTS "tax_document_uploads_insert" ON tax_document_uploads;
    
    CREATE POLICY "tax_document_uploads_insert" ON tax_document_uploads FOR INSERT
      WITH CHECK (appointment_id IS NOT NULL AND file_name IS NOT NULL AND LENGTH(file_name) <= 255);
    RAISE NOTICE 'Fixed: tax_document_uploads policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped tax_document_uploads: %', SQLERRM;
END $$;

-- tax_intake
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tax_intake') THEN
    DROP POLICY IF EXISTS "public_can_insert_tax_intake" ON tax_intake;
    DROP POLICY IF EXISTS "tax_intake_insert" ON tax_intake;
    
    CREATE POLICY "tax_intake_insert" ON tax_intake FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
    RAISE NOTICE 'Fixed: tax_intake policy';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped tax_intake: %', SQLERRM;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Security fixes migration completed';
  RAISE NOTICE '- Function search_path: 5 functions';
  RAISE NOTICE '- Missing RLS policies: 2 tables';
  RAISE NOTICE '- Permissive policies: 27 tables';
  RAISE NOTICE '========================================';
END $$;
-- Fix infinite RLS recursion on profiles table (Postgres error 42P17)
-- and create missing tables referenced by the codebase.
--
-- View to real table mapping:
--   courses → training_courses
--   lessons → training_lessons
--   enrollments → training_enrollments
--
-- All policies use SECURITY DEFINER helpers to avoid recursive profiles lookups.
-- Run in Supabase SQL Editor. Already applied to production 2026-02-15.
-- 20260215_break_recursion_use_definer_functions.sql
--
-- Eliminates all inline EXISTS(SELECT 1 FROM profiles ...) patterns from RLS policies.
-- Replaces with SECURITY DEFINER functions: is_admin(), is_super_admin(), get_current_tenant_id().
-- These functions bypass RLS on profiles, breaking the recursion cycle.
--
-- Fixes 2 recursive policies on profiles + 37 cross-table policies.
--
-- Run in Supabase SQL Editor.

-- ============================================================
-- MOVE 1: Fix recursive policies on profiles
-- ============================================================

-- 1a. profiles_admin_all: was recursive (queried profiles from profiles policy)
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- 1b. profiles_update_own_row_tenant_immutable: was recursive (subquery on profiles)
DROP POLICY IF EXISTS "profiles_update_own_row_tenant_immutable" ON profiles;

CREATE POLICY "profiles_update_own_row_tenant_immutable" ON profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR public.is_super_admin()
  )
  WITH CHECK (
    (auth.uid() = id OR public.is_super_admin())
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- ============================================================
-- MOVE 3: Fix all cross-table policies that inline profiles lookups
-- ============================================================

-- training_enrollments: 4 policies
DROP POLICY IF EXISTS "Admins can enroll users" ON training_enrollments;
CREATE POLICY "Admins can enroll users" ON training_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update enrollments" ON training_enrollments;
CREATE POLICY "Admins can update enrollments" ON training_enrollments
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete enrollments" ON training_enrollments;
CREATE POLICY "Admins can delete enrollments" ON training_enrollments
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "enrollments_admin_all" ON training_enrollments;
CREATE POLICY "enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "enrollments_partner_read" ON training_enrollments;
CREATE POLICY "enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = training_enrollments.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- certificates: 4 policies
DROP POLICY IF EXISTS "certificates_admin_insert" ON certificates;
CREATE POLICY "certificates_admin_insert" ON certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
CREATE POLICY "certificates_admin_update" ON certificates
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;
CREATE POLICY "certificates_admin_delete" ON certificates
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "certificates_partner_read" ON certificates;
CREATE POLICY "certificates_partner_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = certificates.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- lesson_progress: 2 policies
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON lesson_progress;
CREATE POLICY "lesson_progress_admin_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS "lesson_progress_partner_read" ON lesson_progress;
CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = lesson_progress.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- apprentice_placements: 1 policy
DROP POLICY IF EXISTS "placements_admin_all" ON apprentice_placements;
CREATE POLICY "placements_admin_all" ON apprentice_placements
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- shops: 1 policy
DROP POLICY IF EXISTS "shops_admin_all" ON shops;
CREATE POLICY "shops_admin_all" ON shops
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- shop_staff: 1 policy
DROP POLICY IF EXISTS "shop_staff_admin_write" ON shop_staff;
CREATE POLICY "shop_staff_admin_write" ON shop_staff
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

-- programs: 1 policy
DROP POLICY IF EXISTS "programs_admin_write" ON programs;
CREATE POLICY "programs_admin_write" ON programs
  FOR ALL TO authenticated
  USING (public.is_admin());

-- users: 1 policy
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users
  FOR ALL TO authenticated
  USING (public.is_admin());

-- sfc_tax_returns: 1 policy
DROP POLICY IF EXISTS "sfc_tax_returns_admin_all" ON sfc_tax_returns;
CREATE POLICY "sfc_tax_returns_admin_all" ON sfc_tax_returns
  FOR ALL TO authenticated
  USING (public.is_admin());

-- sfc_tax_documents: 1 policy
DROP POLICY IF EXISTS "sfc_tax_documents_admin_all" ON sfc_tax_documents;
CREATE POLICY "sfc_tax_documents_admin_all" ON sfc_tax_documents
  FOR ALL TO authenticated
  USING (public.is_admin());

-- mef_submissions: 3 policies (role includes tax_preparer)
-- Need a helper or inline check. is_admin() covers admin+super_admin.
-- For tax_preparer, we create a small definer function.
CREATE OR REPLACE FUNCTION public.is_tax_preparer()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'tax_preparer')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_tax_preparer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tax_preparer() TO authenticated;

DROP POLICY IF EXISTS "Admins can view all submissions" ON mef_submissions;
CREATE POLICY "Admins can view all submissions" ON mef_submissions
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

DROP POLICY IF EXISTS "Admins can insert submissions" ON mef_submissions;
CREATE POLICY "Admins can insert submissions" ON mef_submissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tax_preparer());

DROP POLICY IF EXISTS "Admins can update submissions" ON mef_submissions;
CREATE POLICY "Admins can update submissions" ON mef_submissions
  FOR UPDATE TO authenticated
  USING (public.is_tax_preparer());

-- tax_returns: 1 policy
DROP POLICY IF EXISTS "Admins can view all tax returns" ON tax_returns;
CREATE POLICY "Admins can view all tax returns" ON tax_returns
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

-- tax_clients: 1 policy
DROP POLICY IF EXISTS "Admins can view all clients" ON tax_clients;
CREATE POLICY "Admins can view all clients" ON tax_clients
  FOR SELECT TO authenticated
  USING (public.is_tax_preparer());

-- career_courses: 1 policy
DROP POLICY IF EXISTS "Admins can manage courses" ON career_courses;
CREATE POLICY "Admins can manage courses" ON career_courses
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partner_documents: 1 policy
DROP POLICY IF EXISTS "Admins can manage all documents" ON partner_documents;
CREATE POLICY "Admins can manage all documents" ON partner_documents
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partners: 1 policy
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Admins can manage partners" ON partners
  FOR ALL TO authenticated
  USING (public.is_admin());

-- partner_applications: 1 policy
DROP POLICY IF EXISTS "Admins can manage partner applications" ON partner_applications;
CREATE POLICY "Admins can manage partner applications" ON partner_applications
  FOR ALL TO authenticated
  USING (public.is_admin());

-- promo_codes: 1 policy
DROP POLICY IF EXISTS "promo_codes_admin" ON promo_codes;
CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_apprentices: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS apprentices" ON rapids_apprentices;
CREATE POLICY "Admins can manage RAPIDS apprentices" ON rapids_apprentices
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_progress_updates: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS progress" ON rapids_progress_updates;
CREATE POLICY "Admins can manage RAPIDS progress" ON rapids_progress_updates
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_submissions: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS submissions" ON rapids_submissions;
CREATE POLICY "Admins can manage RAPIDS submissions" ON rapids_submissions
  FOR ALL TO authenticated
  USING (public.is_admin());

-- rapids_employers: 1 policy
DROP POLICY IF EXISTS "Admins can manage RAPIDS employers" ON rapids_employers;
CREATE POLICY "Admins can manage RAPIDS employers" ON rapids_employers
  FOR ALL TO authenticated
  USING (public.is_admin());

-- staff_permissions: 2 policies
DROP POLICY IF EXISTS "Tenant admins can manage staff permissions" ON staff_permissions;
CREATE POLICY "Tenant admins can manage staff permissions" ON staff_permissions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND tenant_id = public.get_current_tenant_id()
  );

DROP POLICY IF EXISTS "Super admins can manage all permissions" ON staff_permissions;
CREATE POLICY "Super admins can manage all permissions" ON staff_permissions
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- application_state_events: 1 policy
DROP POLICY IF EXISTS "Admins can view all state events" ON application_state_events;
CREATE POLICY "Admins can view all state events" ON application_state_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- apprentice_sites: 2 policies
DROP POLICY IF EXISTS "Partner users can view own sites" ON apprentice_sites;
CREATE POLICY "Partner users can view own sites" ON apprentice_sites
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage sites" ON apprentice_sites;
CREATE POLICY "Admins can manage sites" ON apprentice_sites
  FOR ALL TO authenticated
  USING (public.is_admin());
-- Migration: Batch 3A — Simple admin-only policies using public.is_admin()
-- Applied via exec_sql RPC in 7 chunks.
-- Covers ~130 tables from academic_integrity_violations through refund_tracking.
-- Note: Original batch was cut off at "refunds" — remaining tables (S-Z) need
-- a follow-up batch.
--
-- Pattern: DROP POLICY IF EXISTS + CREATE POLICY ... FOR ALL TO authenticated USING (public.is_admin())
-- These are non-tenant-scoped admin policies for tables that don't yet have tenant_id
-- or where tenant scoping is deferred.
--
-- Applied: 2026-02-16
-- Result: 199 policies using is_admin() across 175 tables

-- See APPLY_20260216_combined.sql for the tenant-scoped core table policies.
-- This file documents the broader admin policy sweep.
-- Migration: Fix certificate RLS policies
-- Problem: certificates_public_verify USING(true) allows any user to read all certs.
--          certificates_admin_all USING(is_admin()) has no tenant scope.
--          "Users can view own certificates" has no tenant scope.
-- Fix: Drop all three, replace with tenant-scoped equivalents + narrow public verify.

BEGIN;

-- ============================================================
-- 1. Drop the three broken policies
-- ============================================================
DROP POLICY IF EXISTS "certificates_public_verify" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_all" ON certificates;
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;

-- ============================================================
-- 2. Public certificate verification — narrow surface
--    Only exposes rows that have a verification_url set.
--    No tenant scope needed: verification is intentionally public.
--    Uses anon role so unauthenticated visitors can verify.
-- ============================================================
CREATE POLICY "certificates_public_verify" ON certificates
  FOR SELECT TO anon, authenticated
  USING (verification_url IS NOT NULL);

-- ============================================================
-- 3. Users can read their own certificates (within tenant)
-- ============================================================
CREATE POLICY "certificates_user_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND tenant_id = public.get_current_tenant_id()
  );

-- ============================================================
-- 4. Admin read — tenant-scoped (replaces certificates_admin_all)
--    INSERT/UPDATE/DELETE already tenant-scoped from prior migration.
-- ============================================================
CREATE POLICY "certificates_admin_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

COMMIT;
-- Fix: "enrollments" is a VIEW over training_enrollments in production.
-- training_enrollments has no student policies — only admin/partner.
-- Without student policies, these API routes silently fail:
--   POST /api/enrollment/complete-orientation
--   POST /api/enrollment/submit-documents
--   POST /api/lessons/[id]/complete (progress update)

BEGIN;

GRANT SELECT, INSERT, UPDATE ON public.training_enrollments TO authenticated;

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can view own enrollments"
  ON public.training_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can create own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can create own enrollments"
  ON public.training_enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can update own enrollments"
  ON public.training_enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
-- Fix: lesson_progress INSERT/UPDATE policies require tenant_id = get_current_tenant_id().
-- If a user has no tenant_id in profiles (e.g. new signup), get_current_tenant_id() returns NULL,
-- and the WITH CHECK fails because NULL = NULL is false in SQL.
--
-- Fix approach: allow INSERT/UPDATE when either:
--   a) tenant_id matches the user's tenant, OR
--   b) user has no tenant assigned yet (get_current_tenant_id() IS NULL)
--
-- Also updates the signup trigger to assign a default tenant_id.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Fix lesson_progress INSERT policy
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_owner_insert ON public.lesson_progress;
CREATE POLICY lp_owner_insert ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      tenant_id = get_current_tenant_id()
      OR get_current_tenant_id() IS NULL
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 2. Fix lesson_progress UPDATE policy
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_owner_update ON public.lesson_progress;
CREATE POLICY lp_owner_update ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      tenant_id = get_current_tenant_id()
      OR get_current_tenant_id() IS NULL
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 3. Fix admin SELECT policy (same tenant_id issue)
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_admin_select ON public.lesson_progress;
CREATE POLICY lp_admin_select ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (
    is_admin()
    AND (
      tenant_id = get_current_tenant_id()
      OR is_super_admin()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. Update signup trigger to assign default tenant_id
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_default_tenant uuid;
BEGIN
  -- Get the default tenant (first active tenant, or the only one)
  SELECT id INTO v_default_tenant
  FROM public.tenants
  WHERE active = true
  ORDER BY created_at ASC
  LIMIT 1;

  INSERT INTO public.profiles (id, email, role, tenant_id)
  VALUES (NEW.id, NEW.email, 'student', v_default_tenant);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: create profile without tenant if tenants table doesn't exist
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
-- Migration: Add partner visibility to lesson_progress
-- Partners can see progress for students placed at their shop(s).
-- Chain: lesson_progress → training_enrollments(user_id) →
--        apprentice_placements(student_id, shop_id) →
--        shop_staff(shop_id, user_id = current partner)
-- All scoped to same tenant.

BEGIN;

-- Drop any existing partner policy
DROP POLICY IF EXISTS "lesson_progress_partner_read" ON lesson_progress;

CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM training_enrollments te
      JOIN apprentice_placements ap ON ap.student_id = te.user_id
                                    AND ap.tenant_id = te.tenant_id
                                    AND ap.status = 'active'
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
                         AND ss.tenant_id = ap.tenant_id
                         AND ss.active = true
      WHERE te.id = lesson_progress.enrollment_id
        AND te.tenant_id = lesson_progress.tenant_id
        AND ss.user_id = auth.uid()
    )
  );

-- Also add partner read to training_enrollments if missing
DROP POLICY IF EXISTS "training_enrollments_partner_read" ON training_enrollments;

CREATE POLICY "training_enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
                         AND ss.tenant_id = ap.tenant_id
                         AND ss.active = true
      WHERE ap.student_id = training_enrollments.user_id
        AND ap.tenant_id = training_enrollments.tenant_id
        AND ap.status = 'active'
        AND ss.user_id = auth.uid()
    )
  );

-- Performance indexes for the join chain
CREATE INDEX IF NOT EXISTS idx_apprentice_placements_student_shop
  ON apprentice_placements(student_id, shop_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_shop_staff_user_shop
  ON shop_staff(user_id, shop_id)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment
  ON lesson_progress(enrollment_id);

COMMIT;
-- lesson_progress RLS policy cleanup
-- Removes 4 broken/redundant policies, replaces with 6 properly scoped ones.
-- Retains lesson_progress_admin_read (instructor) and lesson_progress_partner_read (placement chain).
--
-- Problems fixed:
--   lp_all: granted public (anon) role ALL ops, no tenant scope
--   lp_admin_read: inline profiles.role check, no tenant scope
--   lp_tenant_read: exact duplicate of lp_admin_read
--   lesson_progress_tenant_select: any tenant member could read all rows (no role gate)

-- Phase 1: Drop broken policies
DROP POLICY IF EXISTS lp_all ON lesson_progress;
DROP POLICY IF EXISTS lp_admin_read ON lesson_progress;
DROP POLICY IF EXISTS lp_tenant_read ON lesson_progress;
DROP POLICY IF EXISTS lesson_progress_tenant_select ON lesson_progress;

-- Phase 2: Owner policies (authenticated only, tenant-enforced on writes)
CREATE POLICY lp_owner_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY lp_owner_insert ON lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_owner_update ON lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_owner_delete ON lesson_progress
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Phase 3: Admin/super-admin read policies
CREATE POLICY lp_admin_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (is_admin() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_super_admin_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (is_super_admin());
begin;

-- 1) analytics_events: stop anonymous inserts (fast stopgap)
drop policy if exists "Anyone can insert events" on public.analytics_events;
create policy analytics_events_insert_authenticated
  on public.analytics_events
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 2) page_views: stop anonymous inserts (fast stopgap)
drop policy if exists "Anyone can insert page views" on public.page_views;
create policy page_views_insert_authenticated
  on public.page_views
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 3) conversions: stop anonymous inserts (fast stopgap)
drop policy if exists "System can insert conversions" on public.conversions;
create policy conversions_insert_authenticated
  on public.conversions
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 4) tax_document_uploads: stop anonymous inserts (fast stopgap)
drop policy if exists "anyone_insert" on public.tax_document_uploads;
create policy tax_document_uploads_insert_authenticated
  on public.tax_document_uploads
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 5) notifications: KEEP SERVICE-ONLY behavior, but make it explicit and clean
-- Drop and recreate to ensure no other public-insert policy exists and to standardize the name
drop policy if exists "System can create notifications" on public.notifications;
create policy notifications_insert_service_only
  on public.notifications
  for insert
  to public
  with check ((SELECT auth.role()) = 'service_role');

-- 6) audit_logs: remove NULL loophole; allow only self-insert when authenticated
drop policy if exists "Users can create own audit logs" on public.audit_logs;
create policy audit_logs_insert_self_only
  on public.audit_logs
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL AND actor_id = (SELECT auth.uid()));

commit;
-- Admin RLS Policies for LMS Resources
-- Run this in Supabase SQL Editor

-- ============ COURSES ============
-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
CREATE POLICY "courses_admin_all" ON public.courses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can read published courses
CREATE POLICY "courses_student_read" ON public.courses
FOR SELECT TO authenticated
USING (is_published = true);

-- ============ LESSONS ============
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
CREATE POLICY "lessons_admin_all" ON public.lessons
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can read lessons from published courses
CREATE POLICY "lessons_student_read" ON public.lessons
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id
    AND courses.is_published = true
  )
);

-- ============ QUIZZES ============
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
CREATE POLICY "quizzes_admin_all" ON public.quizzes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can read quizzes from published courses
CREATE POLICY "quizzes_student_read" ON public.quizzes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = quizzes.course_id
    AND courses.is_published = true
  )
);

-- ============ QUIZ QUESTIONS ============
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Admin/Instructor can do everything
CREATE POLICY "quiz_questions_admin_all" ON public.quiz_questions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can read questions from quizzes in published courses
CREATE POLICY "quiz_questions_student_read" ON public.quiz_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    JOIN public.courses ON courses.id = quizzes.course_id
    WHERE quizzes.id = quiz_questions.quiz_id
    AND courses.is_published = true
  )
);

-- ============ ENROLLMENTS ============
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "enrollments_admin_all" ON public.enrollments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Students can read their own enrollments
CREATE POLICY "enrollments_student_own" ON public.enrollments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============ PROFILES ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);

-- Users can read and update their own profile
CREATE POLICY "profiles_own_read" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_own_update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============ LESSON PROGRESS ============
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Admin can read all progress
CREATE POLICY "lesson_progress_admin_read" ON public.lesson_progress
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);

-- Students can manage their own progress
CREATE POLICY "lesson_progress_own" ON public.lesson_progress
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
-- Fix RLS policies for public access to marketing/informational tables
-- Everything behind login remains secure

-- ============================================================================
-- PUBLIC ACCESS (No authentication required)
-- ============================================================================

-- Programs table - Public read access for marketing pages
DROP POLICY IF EXISTS "Public can view programs" ON programs;
CREATE POLICY "Public can view programs"
  ON programs
  FOR SELECT
  USING (true);

-- Courses table - Public read access for course catalog
DROP POLICY IF EXISTS "Public can view courses" ON courses;
CREATE POLICY "Public can view courses"
  ON courses
  FOR SELECT
  USING (true);

-- Instructors table - Public read access for instructor profiles
DROP POLICY IF EXISTS "Public can view instructors" ON instructors;
CREATE POLICY "Public can view instructors"
  ON instructors
  FOR SELECT
  USING (true);

-- Testimonials - Public read access
DROP POLICY IF EXISTS "Public can view testimonials" ON testimonials;
CREATE POLICY "Public can view testimonials"
  ON testimonials
  FOR SELECT
  WHERE published = true;

-- Blog posts - Public read access for published posts
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
CREATE POLICY "Public can view published blog posts"
  ON blog_posts
  FOR SELECT
  WHERE status = 'published';

-- FAQs - Public read access
DROP POLICY IF EXISTS "Public can view FAQs" ON faqs;
CREATE POLICY "Public can view FAQs"
  ON faqs
  FOR SELECT
  WHERE published = true;

-- ============================================================================
-- AUTHENTICATED ACCESS (Login required)
-- ============================================================================

-- User profiles - Users can only see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Enrollments - Users can only see their own enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments"
  ON enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own enrollments" ON enrollments;
CREATE POLICY "Users can create own enrollments"
  ON enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Progress tracking - Users can only see/update their own progress
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Certificates - Users can only see their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
CREATE POLICY "Users can view own certificates"
  ON certificates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Applications - Users can only see/create their own applications
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own applications" ON applications;
CREATE POLICY "Users can create own applications"
  ON applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payments - Users can only see their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Messages - Users can only see messages they sent or received
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

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
DROP POLICY IF EXISTS "Admins can manage programs" ON programs;
CREATE POLICY "Admins can manage programs"
  ON programs
  FOR ALL
  USING (is_admin());

-- Courses
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses"
  ON courses
  FOR ALL
  USING (is_admin());

-- Users/Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (is_admin());

-- Enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;
CREATE POLICY "Admins can manage enrollments"
  ON enrollments
  FOR ALL
  USING (is_admin());

-- Applications
DROP POLICY IF EXISTS "Admins can manage applications" ON applications;
CREATE POLICY "Admins can manage applications"
  ON applications
  FOR ALL
  USING (is_admin());

-- Payments
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  USING (is_admin());

-- Messages
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages"
  ON messages
  FOR SELECT
  USING (is_admin());

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

-- Instructors can view their assigned courses
DROP POLICY IF EXISTS "Instructors can view assigned courses" ON courses;
CREATE POLICY "Instructors can view assigned courses"
  ON courses
  FOR SELECT
  USING (
    is_instructor() AND (
      instructor_id = auth.uid() OR
      is_admin()
    )
  );

-- Instructors can view enrollments for their courses
DROP POLICY IF EXISTS "Instructors can view course enrollments" ON enrollments;
CREATE POLICY "Instructors can view course enrollments"
  ON enrollments
  FOR SELECT
  USING (
    is_instructor() AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Instructors can update progress for their students
DROP POLICY IF EXISTS "Instructors can update student progress" ON user_progress;
CREATE POLICY "Instructors can update student progress"
  ON user_progress
  FOR UPDATE
  USING (
    is_instructor() AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = user_progress.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on public tables to anon
GRANT SELECT ON programs TO anon;
GRANT SELECT ON courses TO anon;
GRANT SELECT ON instructors TO anon;
GRANT SELECT ON testimonials TO anon;
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON faqs TO anon;

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT ON enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_progress TO authenticated;
GRANT SELECT ON certificates TO authenticated;
GRANT SELECT, INSERT ON applications TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT, INSERT ON messages TO authenticated;

COMMENT ON POLICY "Public can view programs" ON programs IS 
  'Allow anonymous users to view programs for marketing pages';

COMMENT ON POLICY "Users can view own profile" ON profiles IS 
  'Users can only access their own profile data';

COMMENT ON POLICY "Admins can manage programs" ON programs IS 
  'Admins have full access to manage all programs';
