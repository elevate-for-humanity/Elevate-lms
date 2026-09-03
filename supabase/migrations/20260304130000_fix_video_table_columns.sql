-- Fix video table columns to match application code

-- video_progress: code writes last_position_seconds, duration_seconds, completed
-- DB has progress_seconds, total_seconds, last_watched
ALTER TABLE video_progress ADD COLUMN IF NOT EXISTS last_position_seconds integer DEFAULT 0;
ALTER TABLE video_progress ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;
ALTER TABLE video_progress ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- Backfill from existing columns
UPDATE video_progress
SET last_position_seconds = COALESCE(progress_seconds, 0),
    duration_seconds = COALESCE(total_seconds, 0)
WHERE last_position_seconds = 0 AND progress_seconds IS NOT NULL;

-- Add unique constraint for upsert (user_id, lesson_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_progress_user_lesson_unique'
  ) THEN
    ALTER TABLE video_progress ADD CONSTRAINT video_progress_user_lesson_unique UNIQUE (user_id, lesson_id);
  END IF;
END $$;

-- video_playback_events: code writes event_type, video_id, page_slug, 
-- current_time, duration, error_message, session_id
-- DB only has action, details
ALTER TABLE video_playback_events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE video_playback_events ADD COLUMN IF NOT EXISTS video_id text;
ALTER TABLE video_playback_events ADD COLUMN IF NOT EXISTS page_slug text;
ALTER TABLE video_playback_events ADD COLUMN IF NOT EXISTS "current_time" numeric;
ALTER TABLE video_playback_events ADD COLUMN IF NOT EXISTS duration numeric;
ALTER TABLE video_playback_events ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE video_playback_events ADD COLUMN IF NOT EXISTS session_id text;

-- videos/[videoId]/meta API reads video_chapters.video_id and video_transcripts.lesson_id
-- These already exist and match.

-- reels table only has id, elevateforhumanity, timestamps — add content columns
ALTER TABLE reels ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- Indexes for video queries
CREATE INDEX IF NOT EXISTS idx_video_progress_user_lesson ON video_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_events_session ON video_playback_events(session_id);
CREATE INDEX IF NOT EXISTS idx_video_events_video ON video_playback_events(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(published, created_at DESC);
