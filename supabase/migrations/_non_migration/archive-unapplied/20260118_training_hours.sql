-- Training Hours Tracking Table
CREATE TABLE IF NOT EXISTS training_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  employer_name VARCHAR(255),
  supervisor_name VARCHAR(255),
  hour_type VARCHAR(20) DEFAULT 'training' CHECK (hour_type IN ('training', 'ojt', 'rti', 'classroom', 'lab', 'online')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_hours_user_id ON training_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_training_hours_date ON training_hours(date);
CREATE INDEX IF NOT EXISTS idx_training_hours_status ON training_hours(status);
CREATE INDEX IF NOT EXISTS idx_training_hours_enrollment ON training_hours(enrollment_id);

-- Enable RLS
ALTER TABLE training_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own hours" ON training_hours
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hours" ON training_hours
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending hours" ON training_hours
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all hours" ON training_hours
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'instructor'))
  );

CREATE POLICY "Admins can update hours" ON training_hours
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'instructor'))
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_training_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_hours_updated_at
  BEFORE UPDATE ON training_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_training_hours_updated_at();

-- Instructor Training Videos Table
CREATE TABLE IF NOT EXISTS instructor_training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration_minutes INTEGER,
  category VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed instructor training videos
INSERT INTO instructor_training_videos (title, description, duration_minutes, category, sort_order) VALUES
('Getting Started with the Platform', 'Learn how to navigate the instructor dashboard and access key features.', 15, 'Getting Started', 1),
('Creating Your First Course', 'Step-by-step guide to creating and publishing your first course.', 25, 'Getting Started', 2),
('Best Practices for Online Teaching', 'Proven techniques for engaging students in virtual environments.', 20, 'Teaching', 3),
('Recording Quality Video Lessons', 'Tips for lighting, audio, and presentation in your video content.', 18, 'Content Creation', 4),
('Managing Student Progress', 'How to track attendance, grades, and student engagement.', 12, 'Management', 5),
('Using the Assessment Tools', 'Create quizzes, assignments, and track student performance.', 22, 'Assessment', 6),
('Communicating with Students', 'Best practices for messaging, announcements, and feedback.', 10, 'Communication', 7),
('Handling Common Issues', 'Troubleshooting guide for common instructor challenges.', 15, 'Support', 8)
ON CONFLICT DO NOTHING;
