-- Add lesson time tracking to lesson_progress table

ALTER TABLE lesson_progress
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_time_met BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Add check constraint for minimum time (5 minutes = 300 seconds)
ALTER TABLE lesson_progress
ADD CONSTRAINT lesson_progress_minimum_time_check
CHECK (
  (completed = false) OR 
  (completed = true AND time_spent_seconds >= 300) OR
  (completed = true AND minimum_time_met = true)
);

-- Create index for time tracking queries
CREATE INDEX IF NOT EXISTS idx_lesson_progress_time_spent ON lesson_progress(time_spent_seconds);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_minimum_time_met ON lesson_progress(minimum_time_met);

-- Function to update time spent
CREATE OR REPLACE FUNCTION update_lesson_time_spent()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last activity timestamp
  NEW.last_activity_at = NOW();
  
  -- Check if minimum time is met (5 minutes)
  IF NEW.time_spent_seconds >= 300 THEN
    NEW.minimum_time_met = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update time spent
DROP TRIGGER IF EXISTS trigger_update_lesson_time_spent ON lesson_progress;
CREATE TRIGGER trigger_update_lesson_time_spent
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_time_spent();

-- Comment
COMMENT ON COLUMN lesson_progress.time_spent_seconds IS 'Total time spent on lesson in seconds';
COMMENT ON COLUMN lesson_progress.minimum_time_met IS 'Whether student met minimum 5-minute requirement';
COMMENT ON COLUMN lesson_progress.started_at IS 'When student first started the lesson';
COMMENT ON COLUMN lesson_progress.last_activity_at IS 'Last time student was active in lesson';
