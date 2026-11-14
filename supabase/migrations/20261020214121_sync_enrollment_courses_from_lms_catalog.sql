-- Use the same published LMS catalog as application approval.
-- Preserve the existing trigger, access-state gate, and enrollment write authority.
CREATE OR REPLACE FUNCTION public.sync_active_program_enrollment_courses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
BEGIN
  IF NEW.user_id IS NULL OR NEW.program_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF coalesce(NEW.enrollment_state, NEW.status) <> 'active' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.course_enrollments (
    student_id, course_id, status, progress, created_at, updated_at
  )
  SELECT NEW.user_id, c.id, 'active', '0', now(), now()
  FROM public.program_courses pc
  JOIN public.lms_courses c ON c.id = pc.course_id
  WHERE pc.program_id = NEW.program_id
    AND c.is_active = true
    AND c.status = 'published'
    AND NOT EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.student_id = NEW.user_id AND ce.course_id = c.id
    )
  ON CONFLICT (student_id, course_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Re-run the existing trigger only where an active enrollment lacks an
-- already-assigned published course. Do not rewrite statuses or funding.
UPDATE public.program_enrollments pe
SET program_id = pe.program_id
WHERE pe.user_id IS NOT NULL
  AND coalesce(pe.enrollment_state, pe.status) = 'active'
  AND EXISTS (
    SELECT 1
    FROM public.program_courses pc
    JOIN public.lms_courses c ON c.id = pc.course_id
    WHERE pc.program_id = pe.program_id
      AND c.is_active = true AND c.status = 'published'
      AND NOT EXISTS (
        SELECT 1 FROM public.course_enrollments ce
        WHERE ce.student_id = pe.user_id AND ce.course_id = c.id
      )
  );
