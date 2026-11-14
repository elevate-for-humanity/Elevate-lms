-- Add video generation pipeline columns to course_lessons.
--
-- Adds the fields needed for the Remotion slide-based video pipeline:
--   script          — full narration text (source for TTS and scene splitting)
--   bullet_points   — structured key points JSONB array
--   duration_seconds — target/actual video length
--   scene_data      — rendered scene JSON fed to Remotion (title, bullets, narration, clip_keyword per scene)
--   video_status    — pipeline state: pending | rendering | complete | failed
--
-- video_url already exists on course_lessons (added in 20260530000002).
-- generation_status already exists (added in 20260604000001) — video_status is
-- a separate, narrower field scoped to the video render job only.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS script           TEXT,
  ADD COLUMN IF NOT EXISTS bullet_points    JSONB    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS scene_data       JSONB,
  ADD COLUMN IF NOT EXISTS video_status     TEXT     NOT NULL DEFAULT 'pending'
    CHECK (video_status IN ('pending', 'rendering', 'complete', 'failed'));

COMMENT ON COLUMN public.course_lessons.script          IS 'Full narration text. Split into scenes by the video pipeline.';
COMMENT ON COLUMN public.course_lessons.bullet_points   IS 'Key teaching points as a JSON string array.';
COMMENT ON COLUMN public.course_lessons.duration_seconds IS 'Target or actual video duration in seconds.';
COMMENT ON COLUMN public.course_lessons.scene_data      IS 'Scene JSON array fed to Remotion: [{scene_number, title, bullets, narration, clip_keyword}].';
COMMENT ON COLUMN public.course_lessons.video_status    IS 'Video render job state: pending | rendering | complete | failed.';
