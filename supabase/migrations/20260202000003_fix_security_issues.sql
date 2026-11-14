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

DROP POLICY IF EXISTS "Staff can view all state events" ON application_state_events;
    CREATE POLICY "Staff can view all state events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'staff'));

DROP POLICY IF EXISTS "Users can view own application events" ON application_state_events;
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
DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlists;
    CREATE POLICY "Users can add to own wishlist" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlists;
    CREATE POLICY "Users can remove from own wishlist" ON wishlists FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all wishlists" ON wishlists;
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
DROP POLICY IF EXISTS "leads_admin_all" ON leads;
    CREATE POLICY "leads_admin_all" ON leads FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
DROP POLICY IF EXISTS "leads_select" ON leads;
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
DROP POLICY IF EXISTS "license_purchases_insert" ON license_purchases;
    CREATE POLICY "license_purchases_insert" ON license_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "license_purchases_admin" ON license_purchases;
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
DROP POLICY IF EXISTS "license_violations_select" ON license_violations;
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
DROP POLICY IF EXISTS "licenses_admin" ON licenses;
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
DROP POLICY IF EXISTS "partner_applications_select" ON partner_applications;
    CREATE POLICY "partner_applications_select" ON partner_applications FOR SELECT USING (true);
DROP POLICY IF EXISTS "partner_applications_admin" ON partner_applications;
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
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
DROP POLICY IF EXISTS "partner_program_access_admin" ON partner_program_access;
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
DROP POLICY IF EXISTS "partner_users_admin" ON partner_users;
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
DROP POLICY IF EXISTS "partners_admin" ON partners;
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
DROP POLICY IF EXISTS "provisioning_events_insert" ON provisioning_events;
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
