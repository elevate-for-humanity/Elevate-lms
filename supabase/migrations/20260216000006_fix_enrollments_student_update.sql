-- Fix: "enrollments" is a VIEW over training_enrollments in production.
-- training_enrollments has no student policies — only admin/partner.
-- Without student policies, these API routes silently fail:
--   POST /api/enrollment/complete-orientation
--   POST /api/enrollment/submit-documents
--   POST /api/lessons/[id]/complete (progress update)

BEGIN;

GRANT SELECT, INSERT, UPDATE ON public.training_enrollments TO authenticated;

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can view own enrollments"
  ON public.training_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can create own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can create own enrollments"
  ON public.training_enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can update own enrollments"
  ON public.training_enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
