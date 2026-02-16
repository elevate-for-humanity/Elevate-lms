-- Add time tracking to lesson progress
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS minimum_time_seconds INTEGER DEFAULT 300; -- 5 minutes
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Add check constraint for minimum time
ALTER TABLE lesson_progress ADD CONSTRAINT minimum_time_check 
  CHECK (completed_at IS NULL OR time_spent_seconds >= minimum_time_seconds);

COMMENT ON COLUMN lesson_progress.time_spent_seconds IS 'Total time spent on lesson';
COMMENT ON COLUMN lesson_progress.minimum_time_seconds IS 'Minimum required time (default 5 minutes)';
