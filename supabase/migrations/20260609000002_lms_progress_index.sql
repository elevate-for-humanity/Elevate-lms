-- Ensure lms_progress has the index and columns needed by updateProgramProgress.
-- lms_progress table was created in an earlier migration; this is additive only.

-- Index for fast upsert lookups
CREATE UNIQUE INDEX IF NOT EXISTS lms_progress_user_course_uidx
  ON public.lms_progress (user_id, course_id);

-- Columns added by updateProgramProgress — additive, safe to re-run
ALTER TABLE public.lms_progress
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Index for dashboard queries: "active learners sorted by last activity"
CREATE INDEX IF NOT EXISTS lms_progress_last_activity_idx
  ON public.lms_progress (last_activity_at DESC NULLS LAST);

-- Index for completion queries
CREATE INDEX IF NOT EXISTS lms_progress_status_idx
  ON public.lms_progress (status);
