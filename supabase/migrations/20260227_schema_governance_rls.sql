-- Schema Governance: RLS Policies for Security-Critical Tables
-- Generated from live Supabase schema (cuxzzpsyufcewtmicszk)
-- Documents the live RLS contract. Uses CREATE POLICY ... IF NOT EXISTS
-- where supported, or DO blocks for safe re-runs.

-- ============================================
-- ADMIN_AUDIT_EVENTS (2 policies)
-- ============================================
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

-- Policy: admins_read_audit
-- Command: SELECT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "admins_read_audit" ON public.admin_audit_events
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: service_insert_audit
-- Command: INSERT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "service_insert_audit" ON public.admin_audit_events
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- APPLICATIONS (12 policies)
-- ============================================
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage applications
-- Command: ALL | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "Admins can manage applications" ON public.applications
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Users can create own applications
-- Command: INSERT | Permissive: RESTRICTIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "Users can create own applications" ON public.applications
  AS RESTRICTIVE
  FOR INSERT
  TO public
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Users can view own applications
-- Command: SELECT | Permissive: RESTRICTIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "Users can view own applications" ON public.applications
  AS RESTRICTIVE
  FOR SELECT
  TO public
  USING ((( SELECT auth.uid() AS uid) = user_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: admins_all
-- Command: ALL | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "admins_all" ON public.applications
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: anyone_insert
-- Command: INSERT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "anyone_insert" ON public.applications
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((email IS NOT NULL) AND (length(email) <= 255) AND (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: applications_admin_all
-- Command: ALL | Permissive: RESTRICTIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "applications_admin_all" ON public.applications
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: applications_own_read
-- Command: SELECT | Permissive: RESTRICTIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "applications_own_read" ON public.applications
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR (email = ( SELECT profiles.email
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: applications_service_only_insert
-- Command: INSERT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "applications_service_only_insert" ON public.applications
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.role() = 'service_role'::text));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: auth_read_applications
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "auth_read_applications" ON public.applications
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: public_insert_applications
-- Command: INSERT | Permissive: PERMISSIVE | Roles: anon,authenticated
DO $$ BEGIN
  CREATE POLICY "public_insert_applications" ON public.applications
  AS PERMISSIVE
  FOR INSERT
  TO anon,authenticated
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: service_role_all_applications
-- Command: ALL | Permissive: PERMISSIVE | Roles: service_role
DO $$ BEGIN
  CREATE POLICY "service_role_all_applications" ON public.applications
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: users_own
-- Command: SELECT | Permissive: RESTRICTIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "users_own" ON public.applications
  AS RESTRICTIVE
  FOR SELECT
  TO public
  USING ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- CERTIFICATES (12 policies)
-- ============================================
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policy: auth_read_certificates
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "auth_read_certificates" ON public.certificates
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_admin_delete
-- Command: DELETE | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "certificates_admin_delete" ON public.certificates
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((is_admin() AND (is_super_admin() OR (tenant_id = get_current_tenant_id()))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_admin_insert
-- Command: INSERT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "certificates_admin_insert" ON public.certificates
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((is_admin() AND (is_super_admin() OR (tenant_id = get_current_tenant_id()))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_admin_read
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "certificates_admin_read" ON public.certificates
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((is_admin() AND (is_super_admin() OR (tenant_id = get_current_tenant_id()))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_admin_update
-- Command: UPDATE | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "certificates_admin_update" ON public.certificates
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((is_admin() AND (is_super_admin() OR (tenant_id = get_current_tenant_id()))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_completion_insert
-- Command: INSERT | Permissive: RESTRICTIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "certificates_completion_insert" ON public.certificates
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (tenant_id = get_current_tenant_id())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_insert
-- Command: INSERT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "certificates_insert" ON public.certificates
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((is_super_admin() OR (tenant_id = get_current_tenant_id())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_partner_read
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "certificates_partner_read" ON public.certificates
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((tenant_id = get_current_tenant_id()) AND (EXISTS ( SELECT 1
   FROM ((apprentice_placements ap
     JOIN shop_staff ss ON (((ss.shop_id = ap.shop_id) AND (ss.tenant_id = ap.tenant_id))))
     JOIN shops s ON (((s.id = ss.shop_id) AND (s.tenant_id = ss.tenant_id))))
  WHERE ((ap.student_id = certificates.user_id) AND (ss.user_id = auth.uid()) AND (ss.active = true) AND (s.active = true))))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_public_verify
-- Command: SELECT | Permissive: PERMISSIVE | Roles: anon,authenticated
DO $$ BEGIN
  CREATE POLICY "certificates_public_verify" ON public.certificates
  AS PERMISSIVE
  FOR SELECT
  TO anon,authenticated
  USING ((verification_url IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_select
-- Command: SELECT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "certificates_select" ON public.certificates
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((is_super_admin() OR (tenant_id = get_current_tenant_id()) OR (user_id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_update
-- Command: UPDATE | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "certificates_update" ON public.certificates
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((is_super_admin() OR (tenant_id = get_current_tenant_id())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: certificates_user_read
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "certificates_user_read" ON public.certificates
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((user_id = auth.uid()) AND (tenant_id = get_current_tenant_id())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- DOCUMENTS (5 policies)
-- ============================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: documents_admin_all
-- Command: ALL | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "documents_admin_all" ON public.documents
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: documents_insert_own
-- Command: INSERT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "documents_insert_own" ON public.documents
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: documents_select_own
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "documents_select_own" ON public.documents
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: documents_service_role
-- Command: ALL | Permissive: PERMISSIVE | Roles: service_role
DO $$ BEGIN
  CREATE POLICY "documents_service_role" ON public.documents
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: documents_update_own
-- Command: UPDATE | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "documents_update_own" ON public.documents
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- ORGANIZATIONS (2 policies)
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy: auth_read_organizations
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "auth_read_organizations" ON public.organizations
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: public_active
-- Command: SELECT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "public_active" ON public.organizations
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((status = 'active'::text));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PROFILES (5 policies)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: profiles_admin_all
-- Command: ALL | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "profiles_admin_all" ON public.profiles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: profiles_insert_own
-- Command: INSERT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "profiles_insert_own" ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: profiles_select_own
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: profiles_service_role
-- Command: ALL | Permissive: PERMISSIVE | Roles: service_role
DO $$ BEGIN
  CREATE POLICY "profiles_service_role" ON public.profiles
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: profiles_update_own
-- Command: UPDATE | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PROGRAM_HOLDERS (6 policies)
-- ============================================
ALTER TABLE public.program_holders ENABLE ROW LEVEL SECURITY;

-- Policy: admins_all
-- Command: ALL | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "admins_all" ON public.program_holders
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: admins_manage_holders
-- Command: ALL | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "admins_manage_holders" ON public.program_holders
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: auth_read_program_holders
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "auth_read_program_holders" ON public.program_holders
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: holders_see_own
-- Command: SELECT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "holders_see_own" ON public.program_holders
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((id = current_program_holder_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: staff_read_holders
-- Command: SELECT | Permissive: PERMISSIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "staff_read_holders" ON public.program_holders
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'staff'::text)))));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: users_own
-- Command: SELECT | Permissive: RESTRICTIVE | Roles: public
DO $$ BEGIN
  CREATE POLICY "users_own" ON public.program_holders
  AS RESTRICTIVE
  FOR SELECT
  TO public
  USING ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TENANTS (2 policies)
-- ============================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own tenant
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "Users can view own tenant" ON public.tenants
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((id = get_current_tenant_id()) OR is_super_admin()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy: auth_read_tenants
-- Command: SELECT | Permissive: PERMISSIVE | Roles: authenticated
DO $$ BEGIN
  CREATE POLICY "auth_read_tenants" ON public.tenants
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
