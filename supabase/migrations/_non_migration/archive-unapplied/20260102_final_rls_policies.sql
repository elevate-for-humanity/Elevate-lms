-- Final Authoritative RLS Policies
-- This migration supersedes all previous RLS configurations
-- Run after all other migrations to ensure clean, conflict-free RLS state

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is instructor
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('instructor', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PUBLIC TABLES (No authentication required)
-- ============================================================================

-- Programs - Public read access
ALTER TABLE IF EXISTS public.programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_programs" ON public.programs;
CREATE POLICY "public_view_programs" ON public.programs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins_manage_programs" ON public.programs;
CREATE POLICY "admins_manage_programs" ON public.programs
  FOR ALL USING (is_admin());

-- Courses - Public read access
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_courses" ON public.courses;
CREATE POLICY "public_view_courses" ON public.courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins_manage_courses_table" ON public.courses;
CREATE POLICY "admins_manage_courses_table" ON public.courses
  FOR ALL USING (is_admin());

-- Instructors - Public read access
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'instructors') THEN
    EXECUTE 'ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public_view_instructors" ON public.instructors';
    EXECUTE 'CREATE POLICY "public_view_instructors" ON public.instructors FOR SELECT USING (true)';
  END IF;
END $$;

-- Testimonials - Public read access (published only)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'testimonials') THEN
    EXECUTE 'ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public_view_published_testimonials" ON public.testimonials';
    EXECUTE 'CREATE POLICY "public_view_published_testimonials" ON public.testimonials FOR SELECT USING (published = true)';
  END IF;
END $$;

-- Blog posts - Public read access (published only)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
    EXECUTE 'ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public_view_published_posts" ON public.blog_posts';
    EXECUTE 'CREATE POLICY "public_view_published_posts" ON public.blog_posts FOR SELECT USING (status = ''published'')';
  END IF;
END $$;

-- FAQs - Public read access (published only)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'faqs') THEN
    EXECUTE 'ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "public_view_published_faqs" ON public.faqs';
    EXECUTE 'CREATE POLICY "public_view_published_faqs" ON public.faqs FOR SELECT USING (published = true)';
  END IF;
END $$;

-- ============================================================================
-- USER TABLES (Authentication required)
-- ============================================================================

-- Profiles - Users can view/update own profile
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;
CREATE POLICY "users_view_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "admins_update_all_profiles" ON public.profiles;
CREATE POLICY "admins_update_all_profiles" ON public.profiles
  FOR UPDATE USING (is_admin());

-- Enrollments - Users can view/create own enrollments
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_own_enrollments_table" ON public.enrollments;
CREATE POLICY "users_view_own_enrollments_table" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_create_own_enrollments" ON public.enrollments;
CREATE POLICY "users_create_own_enrollments" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins_manage_all_enrollments" ON public.enrollments;
CREATE POLICY "admins_manage_all_enrollments" ON public.enrollments
  FOR ALL USING (is_admin());

-- User Progress - Users can view/update own progress
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_progress') THEN
    EXECUTE 'ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_view_own_progress_table" ON public.user_progress';
    EXECUTE 'CREATE POLICY "users_view_own_progress_table" ON public.user_progress FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'DROP POLICY IF EXISTS "users_update_own_progress_table" ON public.user_progress';
    EXECUTE 'CREATE POLICY "users_update_own_progress_table" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Certificates - Users can view own certificates
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'certificates') THEN
    EXECUTE 'ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_view_own_certificates" ON public.certificates';
    EXECUTE 'CREATE POLICY "users_view_own_certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Applications - Users can view/create own applications
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications') THEN
    EXECUTE 'ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_view_own_applications_table" ON public.applications';
    EXECUTE 'CREATE POLICY "users_view_own_applications_table" ON public.applications FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'DROP POLICY IF EXISTS "users_create_own_applications" ON public.applications';
    EXECUTE 'CREATE POLICY "users_create_own_applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Documents - Users can view/upload own documents
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
    EXECUTE 'ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_view_own_documents_table" ON public.documents';
    EXECUTE 'CREATE POLICY "users_view_own_documents_table" ON public.documents FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'DROP POLICY IF EXISTS "users_upload_own_documents_table" ON public.documents';
    EXECUTE 'CREATE POLICY "users_upload_own_documents_table" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_all_documents" ON public.documents';
    EXECUTE 'CREATE POLICY "admins_manage_all_documents" ON public.documents FOR ALL USING (is_admin())';
  END IF;
END $$;

-- ============================================================================
-- MULTI-TENANT TABLES
-- ============================================================================

-- Tenants - Users can view their tenant
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
    EXECUTE 'ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_view_own_tenant" ON public.tenants';
    EXECUTE 'CREATE POLICY "users_view_own_tenant" ON public.tenants FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = tenants.id
      )
    )';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_all_tenants" ON public.tenants';
    EXECUTE 'CREATE POLICY "admins_manage_all_tenants" ON public.tenants FOR ALL USING (is_admin())';
  END IF;
END $$;

-- Licenses - Users can view their tenant licenses
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'licenses') THEN
    EXECUTE 'ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_view_tenant_licenses" ON public.licenses';
    EXECUTE 'CREATE POLICY "users_view_tenant_licenses" ON public.licenses FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = licenses.tenant_id
      )
    )';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_all_licenses" ON public.licenses';
    EXECUTE 'CREATE POLICY "admins_manage_all_licenses" ON public.licenses FOR ALL USING (is_admin())';
  END IF;
END $$;

-- ============================================================================
-- AUDIT & COMPLIANCE TABLES
-- ============================================================================

-- Audit logs - Admins only
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    EXECUTE 'ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "admins_view_audit_logs" ON public.audit_logs';
    EXECUTE 'CREATE POLICY "admins_view_audit_logs" ON public.audit_logs FOR SELECT USING (is_admin())';
  END IF;
END $$;

-- Employment tracking - Users can view own, admins can view all
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employment_tracking') THEN
    EXECUTE 'ALTER TABLE public.employment_tracking ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_view_own_employment" ON public.employment_tracking';
    EXECUTE 'CREATE POLICY "users_view_own_employment" ON public.employment_tracking FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_employment" ON public.employment_tracking';
    EXECUTE 'CREATE POLICY "admins_manage_employment" ON public.employment_tracking FOR ALL USING (is_admin())';
  END IF;
END $$;

-- Credential verification - Users can view own, admins can manage
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credential_verification') THEN
    EXECUTE 'ALTER TABLE public.credential_verification ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "users_view_own_credentials" ON public.credential_verification';
    EXECUTE 'CREATE POLICY "users_view_own_credentials" ON public.credential_verification FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'DROP POLICY IF EXISTS "admins_manage_credentials_table" ON public.credential_verification';
    EXECUTE 'CREATE POLICY "admins_manage_credentials_table" ON public.credential_verification FOR ALL USING (is_admin())';
  END IF;
END $$;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Storage objects - Users can access own folder
DROP POLICY IF EXISTS "users_view_own_storage" ON storage.objects;
CREATE POLICY "users_view_own_storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_upload_own_storage" ON storage.objects;
CREATE POLICY "users_upload_own_storage" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_update_own_storage" ON storage.objects;
CREATE POLICY "users_update_own_storage" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_delete_own_storage" ON storage.objects;
CREATE POLICY "users_delete_own_storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "admins_manage_all_storage" ON storage.objects;
CREATE POLICY "admins_manage_all_storage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents' AND
    is_admin()
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on public tables to anon
GRANT SELECT ON public.programs TO anon;
GRANT SELECT ON public.courses TO anon;

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.enrollments TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add comments
COMMENT ON POLICY "public_view_programs" ON public.programs IS 
  'Allow anonymous users to view programs for marketing pages';

COMMENT ON POLICY "users_view_own_profile" ON public.profiles IS 
  'Users can only access their own profile data';

COMMENT ON POLICY "admins_manage_programs" ON public.programs IS 
  'Admins have full access to manage all programs';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Final RLS policies applied successfully';
  RAISE NOTICE 'This migration supersedes: fix_rls_public_access.sql, 20251227_fix_rls_security_critical.sql';
END $$;
