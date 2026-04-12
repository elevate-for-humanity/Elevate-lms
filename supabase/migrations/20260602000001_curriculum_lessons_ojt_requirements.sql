-- Add OJT enforcement columns to curriculum_lessons.
-- These link a lab lesson to a specific apprentice_skills row and define
-- how many supervised repetitions are required before the lesson can be
-- marked complete.

ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS required_skill_id      UUID REFERENCES public.apprentice_skills(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS required_reps           INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS requires_verification   BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.curriculum_lessons.required_skill_id    IS 'apprentice_skills row that must be logged before this lab lesson can be completed';
COMMENT ON COLUMN public.curriculum_lessons.required_reps        IS 'Minimum number of competency_log entries (supervisor_verified=true if requires_verification) before completion is allowed';
COMMENT ON COLUMN public.curriculum_lessons.requires_verification IS 'If true, each rep must have supervisor_verified=true to count toward required_reps';

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_required_skill
  ON public.curriculum_lessons (required_skill_id)
  WHERE required_skill_id IS NOT NULL;
