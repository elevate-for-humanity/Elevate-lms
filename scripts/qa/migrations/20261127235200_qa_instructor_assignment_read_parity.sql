-- Isolated QA only. Restore the canonical instructor own-assignment read
-- boundary required by canEditCourse / isAssignedCourseInstructor.
-- Production already has the instructor_own policy and authenticated SELECT.
-- Apply after 20261122111944_qa_portal_workspace_schema.sql.
DO $qa_guard$
BEGIN
  IF to_regclass('public.tenants') IS NULL
     OR to_regclass('public.instructor_assignments') IS NULL THEN
    RAISE EXCEPTION 'QA instructor assignment parity: prerequisites missing';
  END IF;
  IF (SELECT count(*) FROM public.tenants WHERE slug = 'elevate-lms-qa') <> 1
     OR EXISTS (SELECT 1 FROM public.tenants WHERE slug IS DISTINCT FROM 'elevate-lms-qa') THEN
    RAISE EXCEPTION 'QA instructor assignment parity: isolated tenant required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.instructor_assignments'::regclass AND relrowsecurity)
     OR EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'instructor_assignments') THEN
    RAISE EXCEPTION 'QA instructor assignment parity: unexpected RLS baseline';
  END IF;
  IF has_table_privilege('anon','public.instructor_assignments','SELECT')
     OR has_table_privilege('authenticated','public.instructor_assignments','SELECT') THEN
    RAISE EXCEPTION 'QA instructor assignment parity: unexpected existing read grant';
  END IF;
END
$qa_guard$;

CREATE POLICY instructor_own ON public.instructor_assignments
  FOR SELECT TO authenticated
  USING (instructor_id = (SELECT auth.uid()));
GRANT SELECT ON public.instructor_assignments TO authenticated;

DO $verify$
BEGIN
  IF NOT has_table_privilege('authenticated','public.instructor_assignments','SELECT')
     OR has_table_privilege('anon','public.instructor_assignments','SELECT')
     OR has_table_privilege('authenticated','public.instructor_assignments','INSERT')
     OR has_table_privilege('authenticated','public.instructor_assignments','UPDATE')
     OR has_table_privilege('authenticated','public.instructor_assignments','DELETE')
     OR NOT EXISTS (
       SELECT 1 FROM pg_policies WHERE schemaname = 'public'
         AND tablename = 'instructor_assignments' AND policyname = 'instructor_own'
         AND cmd = 'SELECT' AND roles = ARRAY['authenticated']::name[]
     ) THEN
    RAISE EXCEPTION 'QA instructor assignment parity: privilege verification failed';
  END IF;
END
$verify$;
NOTIFY pgrst, 'reload schema';
