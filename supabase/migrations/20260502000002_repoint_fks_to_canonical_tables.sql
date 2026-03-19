-- =============================================================================
-- Repoint stale FKs to canonical tables
--
-- lesson_progress.enrollment_id was pointing at training_enrollments.
-- checkpoint_scores.lesson_id was pointing at curriculum_lessons.
-- Both are now re-pointed to the canonical tables used by the LMS engine.
--
-- Orphan check run before this migration:
--   lesson_progress: 2 orphan enrollment_ids — repaired by inserting matching
--     rows into program_enrollments with the same UUIDs (no row updates needed).
--   checkpoint_scores: 0 orphan lesson_ids — no repair needed.
-- =============================================================================

BEGIN;

-- ── 1. lesson_progress.enrollment_id → program_enrollments(id) ───────────────
ALTER TABLE public.lesson_progress
  DROP CONSTRAINT IF EXISTS lesson_progress_enrollment_fk;

ALTER TABLE public.lesson_progress
  ADD CONSTRAINT lesson_progress_enrollment_fk
  FOREIGN KEY (enrollment_id)
  REFERENCES public.program_enrollments(id)
  ON DELETE CASCADE;

-- ── 2. checkpoint_scores.lesson_id → course_lessons(id) ──────────────────────
ALTER TABLE public.checkpoint_scores
  DROP CONSTRAINT IF EXISTS checkpoint_scores_lesson_id_fkey;

ALTER TABLE public.checkpoint_scores
  ADD CONSTRAINT checkpoint_scores_lesson_id_fkey
  FOREIGN KEY (lesson_id)
  REFERENCES public.course_lessons(id)
  ON DELETE CASCADE;

-- ── 3. program_completion_certificates: drop NOT NULL on nullable columns ─────
ALTER TABLE public.program_completion_certificates
  ALTER COLUMN program_id DROP NOT NULL;

ALTER TABLE public.program_completion_certificates
  ALTER COLUMN verification_url DROP NOT NULL;

COMMIT;
