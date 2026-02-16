-- Migration: Create tables for automation functions
-- Created: 2025-01-27

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  program_name TEXT NOT NULL,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  funding_source TEXT DEFAULT 'self-pay',
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job placements table
CREATE TABLE IF NOT EXISTS job_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  starting_salary NUMERIC,
  employment_type TEXT DEFAULT 'full-time',
  placement_date TIMESTAMPTZ DEFAULT NOW(),
  industry TEXT,
  location TEXT,
  benefits JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_funding_source ON enrollments(funding_source);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_job_placements_student_id ON job_placements(student_id);
CREATE INDEX IF NOT EXISTS idx_job_placements_enrollment_id ON job_placements(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_job_placements_placement_date ON job_placements(placement_date);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_type_date ON reports(report_type, generated_at);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)

-- Students: Service role can do everything
CREATE POLICY "Service role full access on students"
  ON students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enrollments: Service role can do everything
CREATE POLICY "Service role full access on enrollments"
  ON enrollments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Job placements: Service role can do everything
CREATE POLICY "Service role full access on job_placements"
  ON job_placements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Activity log: Service role can do everything
CREATE POLICY "Service role full access on activity_log"
  ON activity_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Reports: Service role can do everything
CREATE POLICY "Service role full access on reports"
  ON reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_placements_updated_at
  BEFORE UPDATE ON job_placements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
