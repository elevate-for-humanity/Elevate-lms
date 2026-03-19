-- ============================================================
-- Fix 0: lesson_progress.enrollment_id FK
-- Currently references training_enrollments.
-- New enrollments are in program_enrollments.
-- Drop the FK — enrollment existence is enforced at app layer.
-- ============================================================
ALTER TABLE public.lesson_progress
  DROP CONSTRAINT IF EXISTS lesson_progress_enrollment_fk;

-- ============================================================
-- Fix 1: checkpoint_scores.lesson_id FK
-- Currently references curriculum_lessons only.
-- New courses use course_lessons. Drop FK — enforced at app layer.
-- ============================================================
ALTER TABLE public.checkpoint_scores
  DROP CONSTRAINT IF EXISTS checkpoint_scores_lesson_id_fkey;

-- ============================================================
-- Fix 2: program_completion_certificates
-- program_id NOT NULL blocks courses without a programs row.
-- verification_url NOT NULL requires a value on insert.
-- ============================================================
ALTER TABLE public.program_completion_certificates
  ALTER COLUMN program_id DROP NOT NULL;

ALTER TABLE public.program_completion_certificates
  ALTER COLUMN verification_url DROP NOT NULL;

-- ============================================================
-- Fix 3: program_enrollments trigger raises on NULL program_slug.
-- The trigger validates slug against apprenticeship_programs.
-- Drop known trigger names that contain this guard.
-- ============================================================
DROP TRIGGER IF EXISTS trg_program_enrollment_apprenticeship ON public.program_enrollments;
DROP TRIGGER IF EXISTS trg_apprenticeship_enrollment ON public.program_enrollments;
DROP TRIGGER IF EXISTS program_enrollment_apprenticeship_trigger ON public.program_enrollments;
DROP TRIGGER IF EXISTS on_program_enrollment_insert ON public.program_enrollments;
DROP TRIGGER IF EXISTS handle_program_enrollment ON public.program_enrollments;
