-- ============================================================
-- TRAINING HOURS & PROGRESS TRACKING
-- For apprenticeship programs (Barber, etc.)
-- ============================================================

-- Training Hours Table (Clock In/Out)
CREATE TABLE IF NOT EXISTS training_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id),
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  hour_type TEXT NOT NULL CHECK (hour_type IN ('ojt', 'rti')), -- OJT = On-the-Job, RTI = Related Technical Instruction
  activity_type TEXT,
  employer_name TEXT,
  supervisor_name TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Table (Course/Module Progress)
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id),
  course_id UUID,
  lesson_id UUID,
  module_id UUID,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice Hours Summary View
CREATE OR REPLACE VIEW apprentice_hours_summary AS
SELECT 
  user_id,
  enrollment_id,
  SUM(CASE WHEN hour_type = 'ojt' AND status = 'approved' THEN hours ELSE 0 END) as ojt_hours,
  SUM(CASE WHEN hour_type = 'rti' AND status = 'approved' THEN hours ELSE 0 END) as rti_hours,
  SUM(CASE WHEN status = 'approved' THEN hours ELSE 0 END) as total_approved_hours,
  SUM(CASE WHEN status = 'pending' THEN hours ELSE 0 END) as pending_hours,
  COUNT(*) as total_entries
FROM training_hours
GROUP BY user_id, enrollment_id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_hours_user ON training_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_training_hours_enrollment ON training_hours(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_training_hours_date ON training_hours(date);
CREATE INDEX IF NOT EXISTS idx_training_hours_status ON training_hours(status);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_enrollment ON progress(enrollment_id);

-- RLS Policies
ALTER TABLE training_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own hours
CREATE POLICY "Users can view own training hours" ON training_hours
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own hours
CREATE POLICY "Users can insert own training hours" ON training_hours
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own progress
CREATE POLICY "Users can view own progress" ON progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress" ON progress
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all training hours" ON training_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff', 'instructor')
    )
  );

CREATE POLICY "Admins can view all progress" ON progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff', 'instructor')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON training_hours TO authenticated;
GRANT SELECT, INSERT, UPDATE ON progress TO authenticated;
GRANT SELECT ON apprentice_hours_summary TO authenticated;
