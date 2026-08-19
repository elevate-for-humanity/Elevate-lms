BEGIN;

DROP POLICY IF EXISTS course_generation_jobs_admin_all ON public.course_generation_jobs;
CREATE POLICY course_generation_jobs_admin_all ON public.course_generation_jobs
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS course_publish_audits_admin_all ON public.course_publish_audits;
CREATE POLICY course_publish_audits_admin_all ON public.course_publish_audits
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

REVOKE EXECUTE ON FUNCTION public.can_publish_course(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_organization_course(text,text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_organization_course_lesson(uuid,text,text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.publish_organization_course(uuid) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.can_publish_course(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_organization_course(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_organization_course_lesson(uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_organization_course(uuid) TO service_role;

COMMIT;
