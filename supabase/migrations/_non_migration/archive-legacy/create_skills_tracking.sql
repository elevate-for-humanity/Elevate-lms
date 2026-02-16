-- Skills Tracking System for Multiple Programs
-- Tracks specific skills performed by students across Barber, Nail Tech, and Esthetician programs

-- Create skill_logs table
CREATE TABLE IF NOT EXISTS skill_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  program_type TEXT NOT NULL DEFAULT 'barber',
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skill_logs_student ON skill_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_logs_skill ON skill_logs(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_logs_date ON skill_logs(date);
CREATE INDEX IF NOT EXISTS idx_skill_logs_instructor ON skill_logs(instructor_id);
CREATE INDEX IF NOT EXISTS idx_skill_logs_program ON skill_logs(program_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_skill_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skill_logs_updated_at
  BEFORE UPDATE ON skill_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_logs_updated_at();

-- Create view for skill progress summary
CREATE OR REPLACE VIEW skill_progress_summary AS
SELECT 
  student_id,
  skill_id,
  skill_name,
  category,
  COUNT(*) as times_performed,
  AVG(quality_rating) as avg_rating,
  MAX(quality_rating) as best_rating,
  MIN(quality_rating) as lowest_rating,
  MAX(date) as last_performed,
  MIN(date) as first_performed
FROM skill_logs
GROUP BY student_id, skill_id, skill_name, category;

-- Create view for student skill mastery
CREATE OR REPLACE VIEW student_skill_mastery AS
SELECT 
  sl.student_id,
  p.full_name as student_name,
  COUNT(DISTINCT sl.skill_id) as unique_skills_learned,
  COUNT(*) as total_skills_logged,
  AVG(sl.quality_rating) as overall_avg_rating,
  COUNT(CASE WHEN sl.quality_rating >= 4 THEN 1 END) as proficient_count,
  COUNT(CASE WHEN sl.quality_rating = 5 THEN 1 END) as master_count
FROM skill_logs sl
JOIN profiles p ON sl.student_id = p.id
GROUP BY sl.student_id, p.full_name;

-- Enable Row Level Security
ALTER TABLE skill_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own skill logs
CREATE POLICY "Students can view own skill logs"
  ON skill_logs FOR SELECT
  USING (auth.uid() = student_id);

-- Policy: Instructors can view all skill logs
CREATE POLICY "Instructors can view all skill logs"
  ON skill_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin', 'staff')
    )
  );

-- Policy: Instructors can insert skill logs
CREATE POLICY "Instructors can insert skill logs"
  ON skill_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin', 'staff')
    )
  );

-- Policy: Instructors can update skill logs
CREATE POLICY "Instructors can update skill logs"
  ON skill_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('instructor', 'admin', 'staff')
    )
  );

-- Policy: Admins can delete skill logs
CREATE POLICY "Admins can delete skill logs"
  ON skill_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Table and column comments
COMMENT ON TABLE skill_logs IS 'Tracks specific skills performed by students across multiple programs (barber, nail tech, esthetician)';
COMMENT ON COLUMN skill_logs.program_type IS 'Program type: barber, nail-tech, esthetician';
COMMENT ON COLUMN skill_logs.skill_id IS 'Unique identifier for the skill (e.g., low-fade, acrylic-application, chemical-peel)';
COMMENT ON COLUMN skill_logs.quality_rating IS 'Rating from 1-5: 1=Needs Work, 3=Proficient, 5=Master Level';
COMMENT ON COLUMN skill_logs.category IS 'Skill category varies by program. Barber: Fundamentals, Fades, Classic Cuts, Modern Styles, Facial Hair, Finishing. Nail Tech: Manicure, Pedicure, Enhancements, Art, Health, Sanitation. Esthetician: Facial Treatments, Advanced Treatments, Hair Removal, Lash & Brow, Body Treatments, Makeup, Consultation';
