-- Repair student applications that were marked approved without any canonical
-- enrollment or funding/payment evidence, then prevent that partial-success
-- state from recurring. The canonical application state machine permits
-- approved -> under_review for remediation, so do not bypass governance.

UPDATE public.applications a
SET
  status = 'under_review',
  updated_at = now()
WHERE a.type = 'student'
  AND a.status = 'approved'
  AND COALESCE(a.funding_verified, false) = false
  AND COALESCE(a.has_workone_approval, false) = false
  AND NOT EXISTS (
    SELECT 1
    FROM public.program_enrollments pe
    WHERE pe.program_id = a.program_id
      AND COALESCE(pe.user_id, pe.student_id) = a.user_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.stripe_sessions_staging ss
    WHERE ss.application_id::text = a.id::text
      AND ss.payment_status = 'paid'
  );

CREATE OR REPLACE FUNCTION public.guard_student_application_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  IF NEW.type = 'student' AND NEW.status = 'approved' THEN
    IF NEW.user_id IS NULL OR NEW.program_id IS NULL THEN
      RAISE EXCEPTION 'STUDENT_APPROVAL_REQUIRES_IDENTITY_AND_PROGRAM'
        USING ERRCODE = '23514';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.program_enrollments pe
      WHERE pe.program_id = NEW.program_id
        AND COALESCE(pe.user_id, pe.student_id) = NEW.user_id
        AND COALESCE(pe.enrollment_state, pe.status) IN ('active', 'completed')
    ) THEN
      RAISE EXCEPTION 'STUDENT_APPROVAL_REQUIRES_ACTIVE_ENROLLMENT'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_student_application_approval() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_student_application_approval() TO service_role;

DROP TRIGGER IF EXISTS trg_guard_student_application_approval ON public.applications;
CREATE TRIGGER trg_guard_student_application_approval
BEFORE INSERT OR UPDATE OF status, user_id, program_id, type
ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.guard_student_application_approval();
