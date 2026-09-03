-- Durable learner attempts for Course Builder interactive lesson experiences.
-- The lesson record remains the canonical content source; this table stores
-- learner-specific answers, scores, retries and remediation targets.

CREATE TABLE IF NOT EXISTS public.interaction_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  lesson_slug text NOT NULL,
  interaction_id text NOT NULL,
  interaction_type text NOT NULL CHECK (
    interaction_type IN (
      'knowledge-check',
      'scenario',
      'case-study',
      'decision-tree',
      'matching',
      'drag-drop',
      'simulation',
      'practical',
      'interactive-video'
    )
  ),
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  completed boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  weak_objectives text[] NOT NULL DEFAULT '{}'::text[],
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (learner_id, lesson_id, interaction_id)
);

CREATE INDEX IF NOT EXISTS interaction_progress_learner_course_idx
  ON public.interaction_progress (learner_id, course_id);

CREATE INDEX IF NOT EXISTS interaction_progress_course_idx
  ON public.interaction_progress (course_id);

CREATE INDEX IF NOT EXISTS interaction_progress_lesson_idx
  ON public.interaction_progress (lesson_id, interaction_type);

ALTER TABLE public.interaction_progress ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.interaction_progress FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interaction_progress TO authenticated;
GRANT ALL ON public.interaction_progress TO service_role;

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

DROP POLICY IF EXISTS interaction_progress_admin_select ON public.interaction_progress;

COMMENT ON TABLE public.interaction_progress IS
  'Per-learner Course Builder interaction attempts, scores, retries and remediation targets.';
