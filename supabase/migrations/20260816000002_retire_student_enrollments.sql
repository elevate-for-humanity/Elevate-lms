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

DROP TRIGGER IF EXISTS trg_enforce_student_enrollment_program_and_hours
  ON public.student_enrollments;
DROP FUNCTION IF EXISTS public.enforce_student_enrollment_program_and_hours();
DROP TABLE public.student_enrollments;
