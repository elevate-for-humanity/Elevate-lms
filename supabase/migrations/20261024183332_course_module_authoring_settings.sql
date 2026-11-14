-- Retain manual module authoring settings used by saveCourseModule.
-- Learner progression remains in module_completion_rules; lesson compliance
-- settings remain in the dedicated course_lessons columns.
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.course_modules.metadata IS
  'Module authoring settings. Does not replace module_completion_rules or lesson compliance fields.';
