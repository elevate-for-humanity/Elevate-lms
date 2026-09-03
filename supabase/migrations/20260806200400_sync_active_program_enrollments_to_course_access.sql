-- Keep program enrollment (canonical program-level record) synchronized with
-- course_enrollments (canonical LMS course-access records).
--
-- training_enrollments was retired by the table-consolidation migration, so
-- approval flows must not depend on that legacy table.

CREATE UNIQUE INDEX IF NOT EXISTS course_enrollments_student_course_uidx
  ON public.course_enrollments(student_id, course_id)
  WHERE student_id IS NOT NULL AND course_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_active_program_enrollment_courses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.program_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.enrollment_state, NEW.status) <> 'active' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.course_enrollments (
    student_id,
    course_id,
    status,
    progress,
    created_at,
    updated_at
  )
  SELECT
    NEW.user_id,
    lc.id,
    'active',
    '0',
    now(),
    now()
  FROM public.lms_courses lc
  WHERE lc.program_id = NEW.program_id
    AND lc.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.course_enrollments ce
      WHERE ce.student_id = NEW.user_id
        AND ce.course_id = lc.id
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_active_program_enrollment_courses
  ON public.program_enrollments;

CREATE TRIGGER trg_sync_active_program_enrollment_courses
AFTER INSERT OR UPDATE OF program_id, user_id, status, enrollment_state
ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.sync_active_program_enrollment_courses();

-- Backfill existing active program enrollments so current learners receive the
-- same course-access invariant as future approvals.
INSERT INTO public.course_enrollments (
  student_id,
  course_id,
  status,
  progress,
  created_at,
  updated_at
)
SELECT
  pe.user_id,
  lc.id,
  'active',
  '0',
  now(),
  now()
FROM public.program_enrollments pe
JOIN public.lms_courses lc
  ON lc.program_id = pe.program_id
 AND lc.is_active = true
WHERE pe.user_id IS NOT NULL
  AND COALESCE(pe.enrollment_state, pe.status) = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    WHERE ce.student_id = pe.user_id
      AND ce.course_id = lc.id
  );
