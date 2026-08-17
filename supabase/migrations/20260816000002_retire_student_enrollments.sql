-- Phase 2: run after the application deployment containing the canonical
-- program_enrollments readers and writers is healthy.

UPDATE public.student_hours sh
SET enrollment_id = pe.id
FROM public.student_enrollments se
JOIN public.apprenticeship_programs ap ON ap.id = se.program_id
JOIN public.program_enrollments pe
  ON pe.student_id = se.student_id
  AND pe.program_slug = COALESCE(se.program_slug, ap.slug)
WHERE sh.enrollment_id = se.id
  AND sh.enrollment_id IS DISTINCT FROM pe.id;

ALTER TABLE public.student_hours
  DROP CONSTRAINT IF EXISTS student_hours_enrollment_fk;
ALTER TABLE public.student_hours
  ADD CONSTRAINT student_hours_program_enrollment_fk
  FOREIGN KEY (enrollment_id) REFERENCES public.program_enrollments(id)
  ON DELETE CASCADE;

CREATE OR REPLACE VIEW public.v_paid_not_enrolled AS
SELECT
  s.session_id,
  s.email,
  s.amount,
  s.program_slug,
  s.application_id,
  s.user_id,
  s.student_id,
  s.kind,
  s.created_at AS paid_at,
  a.id AS app_id_resolved,
  a.status AS app_status
FROM public.stripe_sessions_staging s
LEFT JOIN public.applications a ON a.id::text = s.application_id
LEFT JOIN public.program_enrollments pe
  ON pe.stripe_checkout_session_id = s.session_id
  OR (pe.stripe_payment_intent_id = s.payment_intent AND s.payment_intent IS NOT NULL)
  OR (
    COALESCE(pe.user_id, pe.student_id)::text = COALESCE(s.user_id, s.student_id)
    AND pe.program_slug = s.program_slug
    AND COALESCE(s.user_id, s.student_id) IS NOT NULL
    AND s.program_slug IS NOT NULL
  )
  OR (
    pe.user_id = a.user_id
    AND pe.program_slug = s.program_slug
    AND a.user_id IS NOT NULL
  )
WHERE pe.id IS NULL;

DROP POLICY IF EXISTS "Students view course media" ON public.media_assets;
CREATE POLICY "Students view course media" ON public.media_assets
FOR SELECT USING (
  course_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.program_enrollments pe
    WHERE COALESCE(pe.user_id, pe.student_id) = (SELECT auth.uid())
      AND pe.course_id = media_assets.course_id
      AND pe.status = 'active'
  )
);

DROP POLICY IF EXISTS authenticated_read_enrolled_sessions ON public.cohort_sessions;
CREATE POLICY authenticated_read_enrolled_sessions ON public.cohort_sessions
FOR SELECT TO authenticated USING (
  cohort_id IN (
    SELECT pe.cohort_id FROM public.program_enrollments pe
    WHERE COALESCE(pe.user_id, pe.student_id) = (SELECT auth.uid())
      AND pe.cohort_id IS NOT NULL
  )
);

DROP POLICY IF EXISTS "students read own hours" ON public.student_hours;
CREATE POLICY "students read own hours" ON public.student_hours
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.program_enrollments pe
    WHERE pe.id = student_hours.enrollment_id
      AND COALESCE(pe.user_id, pe.student_id) = (SELECT auth.uid())
  )
);

DROP TRIGGER IF EXISTS trg_enforce_student_enrollment_program_and_hours
  ON public.student_enrollments;
DROP TRIGGER IF EXISTS trg_set_student_enrollment_hours_from_apprenticeship_program
  ON public.student_enrollments;
DROP TABLE public.student_enrollments;
DROP FUNCTION IF EXISTS public.enforce_student_enrollment_program_and_hours();
DROP FUNCTION IF EXISTS public.set_student_enrollment_hours_from_apprenticeship_program();
