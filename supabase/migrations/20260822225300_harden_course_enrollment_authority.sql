-- Protect enrollment authority at the database boundary.
-- 1) Every program enrollment receives tenant ownership even when written by
--    service-role application code.
-- 2) Learners may read course enrollments but cannot self-enroll, mutate, or
--    delete them directly.

CREATE OR REPLACE FUNCTION public.set_program_enrollment_tenant_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_profile_tenant uuid;
  v_program_tenant uuid;
BEGIN
  IF COALESCE(NEW.user_id, NEW.student_id) IS NOT NULL THEN
    SELECT p.tenant_id
    INTO v_profile_tenant
    FROM public.profiles p
    WHERE p.id = COALESCE(NEW.user_id, NEW.student_id)
    LIMIT 1;
  END IF;

  IF NEW.program_id IS NOT NULL THEN
    SELECT p.tenant_id
    INTO v_program_tenant
    FROM public.programs p
    WHERE p.id = NEW.program_id
    LIMIT 1;
  END IF;

  NEW.tenant_id := COALESCE(NEW.tenant_id, v_profile_tenant, v_program_tenant);

  IF NEW.tenant_id IS NULL THEN
    RAISE EXCEPTION 'PROGRAM_ENROLLMENT_TENANT_REQUIRED: cannot resolve tenant ownership'
      USING ERRCODE = '23502';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_program_enrollment_tenant_context() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_program_enrollment_tenant_context() TO service_role;

DROP TRIGGER IF EXISTS trg_set_program_enrollment_tenant_context ON public.program_enrollments;
CREATE TRIGGER trg_set_program_enrollment_tenant_context
BEFORE INSERT OR UPDATE OF user_id, student_id, program_id, tenant_id
ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.set_program_enrollment_tenant_context();

-- course_enrollments --------------------------------------------------------
DROP POLICY IF EXISTS admin_all ON public.course_enrollments;
DROP POLICY IF EXISTS user_own ON public.course_enrollments;
DROP POLICY IF EXISTS course_enrollments_admin_all ON public.course_enrollments;
DROP POLICY IF EXISTS course_enrollments_staff_read ON public.course_enrollments;
DROP POLICY IF EXISTS course_enrollments_user_read_own ON public.course_enrollments;
DROP POLICY IF EXISTS require_privileged_aal2 ON public.course_enrollments;

CREATE POLICY course_enrollments_user_read_own ON public.course_enrollments
FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY course_enrollments_admin_all ON public.course_enrollments
FOR ALL TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.profiles subject
      WHERE subject.id = course_enrollments.student_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.profiles subject
      WHERE subject.id = course_enrollments.student_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
);

CREATE POLICY course_enrollments_staff_read ON public.course_enrollments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles caller
    JOIN public.profiles subject
      ON subject.id = course_enrollments.student_id
    WHERE caller.id = auth.uid()
      AND caller.role = 'staff'
      AND caller.tenant_id = rpc_private.get_current_tenant_id()
      AND subject.tenant_id = rpc_private.get_current_tenant_id()
  )
);

CREATE POLICY require_privileged_aal2 ON public.course_enrollments
AS RESTRICTIVE
FOR ALL TO authenticated
USING ((SELECT security_private.privileged_session_mfa_satisfied()))
WITH CHECK ((SELECT security_private.privileged_session_mfa_satisfied()));
