-- Create lms_progress table for tracking course completion
-- This table is used by the LMS completion system

CREATE TABLE IF NOT EXISTS lms_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_slug TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed_at TIMESTAMPTZ,
  evidence_url TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lms_progress_user_id ON lms_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_course_id ON lms_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_status ON lms_progress(status);
CREATE INDEX IF NOT EXISTS idx_lms_progress_completed_at ON lms_progress(completed_at DESC);

-- Enable RLS
ALTER TABLE lms_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress"
  ON lms_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON lms_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON lms_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON lms_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_lms_progress_updated_at
  BEFORE UPDATE ON lms_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sync existing course_progress data to lms_progress
INSERT INTO lms_progress (user_id, course_id, status, progress_percent, completed_at, created_at, updated_at)
SELECT 
  user_id, 
  course_id, 
  status, 
  progress_percentage as progress_percent, 
  completed_at, 
  created_at, 
  updated_at
FROM course_progress
ON CONFLICT (user_id, course_id) DO NOTHING;
