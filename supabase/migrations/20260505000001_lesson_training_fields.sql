-- ============================================================
-- LESSON TRAINING FIELDS
--
-- Adds the minimum fields needed to convert course_lessons from
-- a content row into a training unit:
--
--   video_url        — per-lesson skill demo video
--   activity_type    — 'standard' | 'video_demo' | 'scenario' | 'checklist'
--   scenario_prompt  — applied scenario the learner must reason through
--   key_terms        — JSONB array of {term, definition} objects
--
-- Creates user_lesson_attempts to track quiz attempts per learner,
-- enabling retry loops, pass/fail enforcement, and future weak-area flagging.
--
-- Apply via Supabase Dashboard SQL Editor.
-- ============================================================

-- ── course_lessons additions ──────────────────────────────────────────────────

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS video_url       TEXT,
  ADD COLUMN IF NOT EXISTS activity_type   TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS scenario_prompt TEXT,
  ADD COLUMN IF NOT EXISTS key_terms       JSONB;

COMMENT ON COLUMN public.course_lessons.video_url IS
  'Per-lesson skill demo video. Rendered above content in the training flow.';
COMMENT ON COLUMN public.course_lessons.activity_type IS
  'Lesson activity shape: standard | video_demo | scenario | checklist | lab';
COMMENT ON COLUMN public.course_lessons.scenario_prompt IS
  'Applied scenario the learner reads before the quick-check quiz. '
  'Forces reasoning, not recall.';
COMMENT ON COLUMN public.course_lessons.key_terms IS
  'Array of {term: string, definition: string} objects. '
  'Rendered as a compact glossary block before the scenario.';

-- ── user_lesson_attempts ──────────────────────────────────────────────────────
-- Tracks every quiz attempt per learner per lesson.
-- Separate from lesson_progress (which tracks completion state).
-- This table drives: retry loops, attempt counts, weak-area flagging.

CREATE TABLE IF NOT EXISTS public.user_lesson_attempts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id      UUID        NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id      UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  score          INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),
  passed         BOOLEAN     NOT NULL GENERATED ALWAYS AS (score >= 70) STORED,
  attempt_number INTEGER     NOT NULL DEFAULT 1,
  answers        JSONB,      -- {questionId: selectedIndex} for review/remediation
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index for fast per-user per-lesson lookups
CREATE INDEX IF NOT EXISTS idx_user_lesson_attempts_user_lesson
  ON public.user_lesson_attempts (user_id, lesson_id);

-- Index for weak-area queries: find all failed attempts by course
CREATE INDEX IF NOT EXISTS idx_user_lesson_attempts_course_failed
  ON public.user_lesson_attempts (course_id, passed)
  WHERE passed = false;

COMMENT ON TABLE public.user_lesson_attempts IS
  'Every quiz attempt per learner per lesson. '
  'Drives retry enforcement, attempt counts, and weak-area detection. '
  'Separate from lesson_progress which tracks completion state only.';

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_lesson_attempts ENABLE ROW LEVEL SECURITY;

-- Learners can read and insert their own attempts
CREATE POLICY "learner_own_attempts_select"
  ON public.user_lesson_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "learner_own_attempts_insert"
  ON public.user_lesson_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins and instructors can read all attempts (for review/reporting)
CREATE POLICY "admin_attempts_select"
  ON public.user_lesson_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

GRANT SELECT, INSERT ON public.user_lesson_attempts TO authenticated;
GRANT ALL ON public.user_lesson_attempts TO service_role;
