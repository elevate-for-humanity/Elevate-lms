-- Keep learner progress authorization efficient at production scale.

CREATE INDEX IF NOT EXISTS interaction_progress_course_idx
  ON public.interaction_progress (course_id);

DROP POLICY IF EXISTS interaction_progress_admin_select ON public.interaction_progress;

DROP POLICY IF EXISTS interaction_progress_owner_select ON public.interaction_progress;
CREATE POLICY interaction_progress_owner_select
  ON public.interaction_progress
  FOR SELECT TO authenticated
  USING (
    learner_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS interaction_progress_owner_insert ON public.interaction_progress;
CREATE POLICY interaction_progress_owner_insert
  ON public.interaction_progress
  FOR INSERT TO authenticated
  WITH CHECK (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS interaction_progress_owner_update ON public.interaction_progress;
CREATE POLICY interaction_progress_owner_update
  ON public.interaction_progress
  FOR UPDATE TO authenticated
  USING (learner_id = (SELECT auth.uid()))
  WITH CHECK (learner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS interaction_progress_owner_delete ON public.interaction_progress;
CREATE POLICY interaction_progress_owner_delete
  ON public.interaction_progress
  FOR DELETE TO authenticated
  USING (learner_id = (SELECT auth.uid()));
