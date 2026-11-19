-- QA-ONLY read policy stage, exact production definitions and SELECT grants.
-- No application write grants, write-only policies, triggers, cron or outbound integrations.
-- Restrictive privileged-session MFA rules preserved; passwords do not imply AAL2.
SET LOCAL search_path=public,extensions;
CREATE SCHEMA IF NOT EXISTS rpc_private;
CREATE SCHEMA IF NOT EXISTS security_private;
REVOKE ALL ON SCHEMA rpc_private,security_private FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA rpc_private,security_private TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'staff')
  );
END;
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."is_admin"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."is_admin"() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.is_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."is_super_admin"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."is_super_admin"() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.get_current_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT partner_id
  FROM partner_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."get_current_tenant_id"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."get_current_tenant_id"() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.current_program_holder_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT program_holder_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."current_program_holder_id"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."current_program_holder_id"() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.get_my_organization_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT ARRAY(
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND status = 'active'
  );
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."get_my_organization_ids"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."get_my_organization_ids"() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.is_platform_owner_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.tenants t ON t.id = p.tenant_id
    WHERE p.id = auth.uid()
      AND t.is_platform_owner = true
      AND p.role IN ('super_admin', 'admin', 'staff')
  );
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."is_platform_owner_user"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."is_platform_owner_user"() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.is_platform_owner_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public', 'rpc_private'
AS $function$SELECT rpc_private.is_platform_owner_user()$function$;
REVOKE ALL ON FUNCTION "public"."is_platform_owner_user"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "public"."is_platform_owner_user"() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.is_platform_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT public.is_platform_owner_user();
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."is_platform_admin"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."is_platform_admin"() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.course_pacing_start(p_user uuid, p_course uuid)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT coalesce(
  (SELECT CASE WHEN e.status IN ('active','enrolled','in_progress','confirmed','completed') AND e.revoked_at IS NULL
    THEN coalesce(e.training_start_date::timestamp AT TIME ZONE 'America/Indiana/Indianapolis',e.student_start_date,e.start_date,e.started_at,e.access_granted_at,e.enrolled_at,e.created_at) END
   FROM public.program_enrollments e
   WHERE (e.user_id=p_user OR e.student_id=p_user) AND e.course_id=p_course
   ORDER BY e.updated_at DESC LIMIT 1),
  (SELECT e.created_at FROM public.course_enrollments e
   WHERE e.student_id=p_user AND e.course_id=p_course
     AND e.status IN ('active','enrolled','in_progress','confirmed','completed') AND e.revoked_at IS NULL
     -- A revoked/pending canonical program enrollment cannot be bypassed by an older secondary row.
     AND NOT EXISTS(SELECT 1 FROM public.program_enrollments pe WHERE pe.course_id=p_course AND (pe.user_id=p_user OR pe.student_id=p_user))
   ORDER BY e.created_at DESC LIMIT 1)
 )
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."course_pacing_start"(p_user uuid, p_course uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."course_pacing_start"(p_user uuid, p_course uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION rpc_private.progressive_course_visible(p_user uuid, p_course uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT (auth.role()='service_role' OR auth.uid()=p_user)
 AND EXISTS(SELECT 1 FROM public.course_pacing_plans p JOIN public.courses c ON c.id=p.course_id
   WHERE p.course_id=p_course AND p.enabled AND p.release_published_lessons AND c.is_active)
 AND rpc_private.course_pacing_start(p_user,p_course) IS NOT NULL
$function$;
REVOKE ALL ON FUNCTION "rpc_private"."progressive_course_visible"(p_user uuid, p_course uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "rpc_private"."progressive_course_visible"(p_user uuid, p_course uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION security_private.privileged_session_mfa_satisfied()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_aal text := coalesce(auth.jwt()->>'aal', 'aal1');
  v_privileged boolean := false;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_uid
      AND lower(coalesce(p.role,'')) IN (
        'super_admin','admin','org_admin','provider_admin','workforce_board_admin'
      )
    UNION ALL
    SELECT 1
    FROM public.user_roles ur
    LEFT JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = v_uid
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND lower(coalesce(r.name, ur.role, '')) IN (
        'super_admin','admin','org_admin','provider_admin','workforce_board_admin'
      )
  ) INTO v_privileged;

  RETURN (NOT v_privileged) OR v_aal = 'aal2';
END;
$function$;
REVOKE ALL ON FUNCTION "security_private"."privileged_session_mfa_satisfied"() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION "security_private"."privileged_session_mfa_satisfied"() TO authenticated,service_role;
CREATE POLICY "admin_all" ON public."organizations" AS PERMISSIVE FOR ALL TO PUBLIC USING (rpc_private.is_platform_admin());
CREATE POLICY "admin_bypass_select" ON public."organizations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (rpc_private.is_admin());
CREATE POLICY "member_select" ON public."organizations" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((rpc_private.is_platform_admin() OR (id = ANY (rpc_private.get_my_organization_ids()))));
CREATE POLICY "require_privileged_aal2" ON public."organizations" AS RESTRICTIVE FOR ALL TO "authenticated" USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));
CREATE POLICY "service_role_all" ON public."organizations" AS PERMISSIVE FOR ALL TO PUBLIC USING ((( SELECT auth.role() AS role) = 'service_role'::text));
CREATE POLICY "profiles_admin_all" ON public."profiles" AS PERMISSIVE FOR ALL TO "authenticated" USING (rpc_private.is_admin()) WITH CHECK (rpc_private.is_admin());
CREATE POLICY "profiles_service_role" ON public."profiles" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);
CREATE POLICY "service_role_profiles_all" ON public."profiles" AS PERMISSIVE FOR ALL TO PUBLIC USING ((( SELECT auth.role() AS role) = 'service_role'::text));
CREATE POLICY "Users can view own tenant" ON public."tenants" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((id = rpc_private.get_current_tenant_id()) OR rpc_private.is_super_admin()));
CREATE POLICY "admin_bypass_select" ON public."tenants" AS PERMISSIVE FOR SELECT TO "authenticated" USING (rpc_private.is_admin());
-- QA grants authenticated tenant reads via the own-tenant and administrator
-- policies above, without enabling the source's unrestricted tenant policy.
CREATE POLICY "require_privileged_aal2" ON public."tenants" AS RESTRICTIVE FOR ALL TO "authenticated" USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));
CREATE POLICY "course_enrollments_admin_all" ON public."course_enrollments" AS PERMISSIVE FOR ALL TO "authenticated" USING ((rpc_private.is_super_admin() OR (rpc_private.is_admin() AND (EXISTS ( SELECT 1
   FROM profiles subject
  WHERE ((subject.id = course_enrollments.student_id) AND (subject.tenant_id = rpc_private.get_current_tenant_id()))))))) WITH CHECK ((rpc_private.is_super_admin() OR (rpc_private.is_admin() AND (EXISTS ( SELECT 1
   FROM profiles subject
  WHERE ((subject.id = course_enrollments.student_id) AND (subject.tenant_id = rpc_private.get_current_tenant_id())))))));
CREATE POLICY "course_enrollments_staff_read" ON public."course_enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (profiles caller
     JOIN profiles subject ON ((subject.id = course_enrollments.student_id)))
  WHERE ((caller.id = ( SELECT auth.uid() AS uid)) AND (caller.role = 'staff'::text) AND (caller.tenant_id = rpc_private.get_current_tenant_id()) AND (subject.tenant_id = rpc_private.get_current_tenant_id())))));
CREATE POLICY "course_enrollments_user_read_own" ON public."course_enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((student_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "require_privileged_aal2" ON public."course_enrollments" AS RESTRICTIVE FOR ALL TO "authenticated" USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));
CREATE POLICY "admin_bypass_select" ON public."courses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (rpc_private.is_admin());
CREATE POLICY "courses_admin_read" ON public."courses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT auth.role() AS role) = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'instructor'::text, 'staff'::text])))))));
CREATE POLICY "courses_anon_catalog" ON public."courses" AS PERMISSIVE FOR SELECT TO "anon" USING (((status = 'published'::course_status) AND (is_active = true)));
CREATE POLICY "courses_authenticated_read" ON public."courses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT auth.role() AS role) = 'authenticated'::text) AND (status = 'published'::course_status) AND (is_active = true)));
CREATE POLICY "courses_organization_authors" ON public."courses" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM organization_users ou
  WHERE ((ou.organization_id = courses.org_id) AND (ou.user_id = ( SELECT auth.uid() AS uid)) AND (ou.status = 'active'::text) AND (ou.role = ANY (ARRAY['org_owner'::text, 'org_admin'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM organization_users ou
  WHERE ((ou.organization_id = courses.org_id) AND (ou.user_id = ( SELECT auth.uid() AS uid)) AND (ou.status = 'active'::text) AND (ou.role = ANY (ARRAY['org_owner'::text, 'org_admin'::text]))))));
CREATE POLICY "courses_service_role" ON public."courses" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);
CREATE POLICY "progressive_course_enrolled_read" ON public."courses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (rpc_private.progressive_course_visible(( SELECT auth.uid() AS uid), id));
CREATE POLICY "require_privileged_aal2" ON public."courses" AS RESTRICTIVE FOR ALL TO "authenticated" USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));
CREATE POLICY "host_shops_select_unified" ON public."host_shops" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((((is_accepting_apprentices = true) AND (shop_status = 'active'::text)) OR (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "program_enrollments_admin_write" ON public."program_enrollments" AS PERMISSIVE FOR ALL TO "authenticated" USING ((rpc_private.is_super_admin() OR (rpc_private.is_admin() AND (tenant_id = rpc_private.get_current_tenant_id())))) WITH CHECK ((rpc_private.is_super_admin() OR (rpc_private.is_admin() AND (tenant_id = rpc_private.get_current_tenant_id()))));
CREATE POLICY "program_enrollments_owner_read" ON public."program_enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = COALESCE(user_id, student_id)));
CREATE POLICY "program_enrollments_service_role" ON public."program_enrollments" AS PERMISSIVE FOR ALL TO "service_role" USING (true) WITH CHECK (true);
CREATE POLICY "program_enrollments_staff_read" ON public."program_enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((rpc_private.is_super_admin() OR ((tenant_id = rpc_private.get_current_tenant_id()) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'staff'::text, 'instructor'::text]))))))));
CREATE POLICY "admin_bypass_select" ON public."program_holders" AS PERMISSIVE FOR SELECT TO "authenticated" USING (rpc_private.is_admin());
CREATE POLICY "admins_all" ON public."program_holders" AS PERMISSIVE FOR ALL TO "authenticated" USING (rpc_private.is_admin()) WITH CHECK (rpc_private.is_admin());
CREATE POLICY "admins_manage_holders" ON public."program_holders" AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
CREATE POLICY "holders_see_own" ON public."program_holders" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((id = rpc_private.current_program_holder_id()));
CREATE POLICY "program_holder_read_own" ON public."program_holders" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((id = ( SELECT profiles.program_holder_id
   FROM profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid))
 LIMIT 1)));
CREATE POLICY "require_privileged_aal2" ON public."program_holders" AS RESTRICTIVE FOR ALL TO "authenticated" USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));
CREATE POLICY "staff_read_holders" ON public."program_holders" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'staff'::text)))));
CREATE POLICY "admin_all" ON public."organization_users" AS PERMISSIVE FOR ALL TO PUBLIC USING (rpc_private.is_platform_admin());
CREATE POLICY "admin_bypass_select" ON public."organization_users" AS PERMISSIVE FOR SELECT TO "authenticated" USING (rpc_private.is_admin());
CREATE POLICY "member_select" ON public."organization_users" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((user_id = ( SELECT auth.uid() AS uid)) OR rpc_private.is_platform_admin() OR (organization_id = ANY (rpc_private.get_my_organization_ids()))));
CREATE POLICY "require_privileged_aal2" ON public."organization_users" AS RESTRICTIVE FOR ALL TO "authenticated" USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));
CREATE POLICY "service_role_all" ON public."organization_users" AS PERMISSIVE FOR ALL TO PUBLIC USING ((( SELECT auth.role() AS role) = 'service_role'::text));
CREATE POLICY "auth_read_programs" ON public."programs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "programs_public_read" ON public."programs" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((status = ANY (ARRAY['active'::text, 'published'::text])));
CREATE POLICY "programs_select" ON public."programs" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((rpc_private.is_super_admin() OR (tenant_id = rpc_private.get_current_tenant_id())));
CREATE POLICY "programs_select_published" ON public."programs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((published = true));
CREATE POLICY "public_view_programs" ON public."programs" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "require_privileged_aal2" ON public."programs" AS RESTRICTIVE FOR ALL TO "authenticated" USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));
GRANT SELECT ON public."course_enrollments" TO "authenticated";
GRANT SELECT ON public."courses" TO "anon";
GRANT SELECT ON public."courses" TO "authenticated";
GRANT SELECT ON public."host_shops" TO "authenticated";
GRANT SELECT ON public."lessons" TO "authenticated";
GRANT SELECT ON public."organization_users" TO "authenticated";
GRANT SELECT ON public."profiles" TO "authenticated";
GRANT SELECT ON public."program_enrollments" TO "authenticated";
GRANT SELECT ON public."program_holders" TO "authenticated";
GRANT SELECT ON public."programs" TO "anon";
GRANT SELECT ON public."programs" TO "authenticated";

GRANT SELECT ON public."organizations" TO "authenticated";
GRANT SELECT ON public."tenants" TO "authenticated";
