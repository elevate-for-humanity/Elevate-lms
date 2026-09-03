-- Phase 5 Step 2: Partner org RLS helpers and policies
-- Applied directly to DB via management API 2026-03-28.

CREATE OR REPLACE FUNCTION public.get_my_organization_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
  );
$$;

-- organizations
DROP POLICY IF EXISTS "public_active"           ON public.organizations;
DROP POLICY IF EXISTS "auth_read_organizations" ON public.organizations;
DROP POLICY IF EXISTS "member_select"           ON public.organizations;
DROP POLICY IF EXISTS "admin_all"               ON public.organizations;
DROP POLICY IF EXISTS "service_role_all"        ON public.organizations;
CREATE POLICY "member_select"    ON public.organizations FOR SELECT USING (is_platform_admin() OR id = ANY(get_my_organization_ids()));
CREATE POLICY "admin_all"        ON public.organizations USING (is_platform_admin());
CREATE POLICY "service_role_all" ON public.organizations USING (auth.role() = 'service_role');

-- organization_users
DROP POLICY IF EXISTS "auth_read_organization_users" ON public.organization_users;
DROP POLICY IF EXISTS "org_users_admin_all"          ON public.organization_users;
DROP POLICY IF EXISTS "org_users_own_read"           ON public.organization_users;
DROP POLICY IF EXISTS "users_own"                    ON public.organization_users;
DROP POLICY IF EXISTS "member_select"                ON public.organization_users;
DROP POLICY IF EXISTS "admin_all"                    ON public.organization_users;
DROP POLICY IF EXISTS "service_role_all"             ON public.organization_users;
CREATE POLICY "member_select"    ON public.organization_users FOR SELECT USING (user_id = auth.uid() OR is_platform_admin() OR organization_id = ANY(get_my_organization_ids()));
CREATE POLICY "admin_all"        ON public.organization_users USING (is_platform_admin());
CREATE POLICY "service_role_all" ON public.organization_users USING (auth.role() = 'service_role');

-- program_organizations
DROP POLICY IF EXISTS "member_select" ON public.program_organizations;
DROP POLICY IF EXISTS "admin_all"     ON public.program_organizations;
DROP POLICY IF EXISTS "service_role_all" ON public.program_organizations;
CREATE POLICY "member_select"    ON public.program_organizations FOR SELECT USING (is_platform_admin() OR organization_id = ANY(get_my_organization_ids()));
CREATE POLICY "admin_all"        ON public.program_organizations USING (is_platform_admin());
CREATE POLICY "service_role_all" ON public.program_organizations USING (auth.role() = 'service_role');

-- cohorts
DROP POLICY IF EXISTS "cohorts_tenant_select"   ON public.cohorts;
DROP POLICY IF EXISTS "cohorts_tenant_insert"   ON public.cohorts;
DROP POLICY IF EXISTS "cohorts_tenant_update"   ON public.cohorts;
DROP POLICY IF EXISTS "cohorts_admin_all"       ON public.cohorts;
DROP POLICY IF EXISTS "cohorts_instructor_read" ON public.cohorts;
DROP POLICY IF EXISTS "org_member_select"       ON public.cohorts;
DROP POLICY IF EXISTS "org_admin_insert"        ON public.cohorts;
DROP POLICY IF EXISTS "org_admin_update"        ON public.cohorts;
DROP POLICY IF EXISTS "admin_all"               ON public.cohorts;
DROP POLICY IF EXISTS "service_role_all"        ON public.cohorts;
CREATE POLICY "org_member_select" ON public.cohorts FOR SELECT  USING      (is_platform_admin() OR organization_id = ANY(get_my_organization_ids()));
CREATE POLICY "org_admin_insert"  ON public.cohorts FOR INSERT  WITH CHECK (is_platform_admin() OR organization_id = ANY(get_my_organization_ids()));
CREATE POLICY "org_admin_update"  ON public.cohorts FOR UPDATE  USING      (is_platform_admin() OR organization_id = ANY(get_my_organization_ids()));
CREATE POLICY "admin_all"         ON public.cohorts USING (is_platform_admin());
CREATE POLICY "service_role_all"  ON public.cohorts USING (auth.role() = 'service_role');

-- cohort_enrollments
DROP POLICY IF EXISTS "org_member_select" ON public.cohort_enrollments;
DROP POLICY IF EXISTS "org_admin_insert"  ON public.cohort_enrollments;
DROP POLICY IF EXISTS "admin_all"         ON public.cohort_enrollments;
DROP POLICY IF EXISTS "service_role_all"  ON public.cohort_enrollments;
CREATE POLICY "org_member_select" ON public.cohort_enrollments FOR SELECT USING (learner_id = auth.uid() OR is_platform_admin() OR EXISTS (SELECT 1 FROM public.cohorts c WHERE c.id = cohort_id AND c.organization_id = ANY(get_my_organization_ids())));
CREATE POLICY "org_admin_insert"  ON public.cohort_enrollments FOR INSERT WITH CHECK (is_platform_admin() OR EXISTS (SELECT 1 FROM public.cohorts c WHERE c.id = cohort_id AND c.organization_id = ANY(get_my_organization_ids())));
CREATE POLICY "admin_all"         ON public.cohort_enrollments USING (is_platform_admin());
CREATE POLICY "service_role_all"  ON public.cohort_enrollments USING (auth.role() = 'service_role');

-- org_invites (canonical invite table — org_invitations is not used)
DROP POLICY IF EXISTS "org_admin_select" ON public.org_invites;
DROP POLICY IF EXISTS "admin_all"        ON public.org_invites;
DROP POLICY IF EXISTS "service_role_all" ON public.org_invites;
CREATE POLICY "org_admin_select" ON public.org_invites FOR SELECT USING (is_platform_admin() OR organization_id = ANY(get_my_organization_ids()));
CREATE POLICY "admin_all"        ON public.org_invites USING (is_platform_admin());
CREATE POLICY "service_role_all" ON public.org_invites USING (auth.role() = 'service_role');
