ALTER TABLE public.interaction_progress DROP CONSTRAINT IF EXISTS interaction_progress_interaction_type_check;
ALTER TABLE public.interaction_progress ADD CONSTRAINT interaction_progress_interaction_type_check CHECK (
  interaction_type IN ('knowledge-check','scenario','case-study','decision-tree','matching','drag-drop','simulation','practical','interactive-video','learning-object')
);
COMMENT ON TABLE public.interaction_progress IS 'Per-learner Course Builder learning-object progress, scored attempts, retries and remediation targets.';
