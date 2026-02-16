-- Staff Training System
-- Tables for training modules and staff progress tracking

-- Training Modules Table
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration INTEGER, -- in minutes
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Training Progress Table
CREATE TABLE IF NOT EXISTS staff_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  certification_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_modules_required ON training_modules(required);
CREATE INDEX IF NOT EXISTS idx_training_modules_order ON training_modules(order_index);
CREATE INDEX IF NOT EXISTS idx_staff_training_progress_user ON staff_training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_training_progress_module ON staff_training_progress(module_id);

-- RLS
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_training_progress ENABLE ROW LEVEL SECURITY;

-- Anyone can view training modules
CREATE POLICY "Anyone can view training modules"
  ON training_modules FOR SELECT
  USING (true);

-- Admin can manage training modules
CREATE POLICY "Admin can manage training modules"
  ON training_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own progress
CREATE POLICY "Users can view own training progress"
  ON staff_training_progress FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can insert own training progress"
  ON staff_training_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update own training progress"
  ON staff_training_progress FOR UPDATE
  USING (user_id = auth.uid());

-- Admin can view all progress
CREATE POLICY "Admin can view all training progress"
  ON staff_training_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE training_modules IS 'Training modules for staff';
COMMENT ON TABLE staff_training_progress IS 'Staff progress through training modules';
