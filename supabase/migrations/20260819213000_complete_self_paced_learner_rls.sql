BEGIN;

DROP POLICY IF EXISTS flashcard_progress_own_insert ON public.flashcard_progress;
CREATE POLICY flashcard_progress_own_insert ON public.flashcard_progress
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS flashcard_progress_own_update ON public.flashcard_progress;
CREATE POLICY flashcard_progress_own_update ON public.flashcard_progress
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS readiness_reports_own_insert ON public.readiness_reports;
CREATE POLICY readiness_reports_own_insert ON public.readiness_reports
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

COMMIT;
