-- Add proctoring flag to quizzes table.
-- When true, the quiz start route creates an exam_sessions row
-- and the quiz page activates the monitoring layer.

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS requires_proctoring BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.quizzes.requires_proctoring IS
  'When true, taking this quiz creates an exam_sessions row and activates webcam recording, tab monitoring, and fullscreen enforcement.';

-- Add quiz_attempt_id to exam_sessions for direct relational linkage.
-- Replaces the earlier proctor_notes-based text association.
ALTER TABLE public.exam_sessions
  ADD COLUMN IF NOT EXISTS quiz_attempt_id UUID;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_quiz_attempt
  ON public.exam_sessions(quiz_attempt_id)
  WHERE quiz_attempt_id IS NOT NULL;
