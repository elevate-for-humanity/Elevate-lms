-- Milady RISE Integration Tables
-- Tracks enrollments, completions, and scholarship applications

-- Enrollments table
CREATE TABLE IF NOT EXISTS milady_rise_enrollments (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  student_id TEXT,
  program TEXT NOT NULL,
  school_code TEXT NOT NULL DEFAULT 'efhcti-rise295',
  school_name TEXT NOT NULL DEFAULT 'Elevate for Humanity Career & Technical Institute',
  enrollment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, completed, expired
  milady_access_sent BOOLEAN DEFAULT FALSE,
  milady_access_sent_date TIMESTAMPTZ,
  certification_completed BOOLEAN DEFAULT FALSE,
  certification_date TIMESTAMPTZ,
  scholarship_eligible BOOLEAN DEFAULT FALSE,
  scholarship_applied BOOLEAN DEFAULT FALSE,
  scholarship_application_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course completions table
CREATE TABLE IF NOT EXISTS milady_rise_completions (
  id BIGSERIAL PRIMARY KEY,
  enrollment_id BIGINT REFERENCES milady_rise_enrollments(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL, -- infection-control, domestic-violence, human-trafficking
  completed_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exam_score INTEGER,
  exam_passed BOOLEAN,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certifications table
CREATE TABLE IF NOT EXISTS milady_rise_certifications (
  id BIGSERIAL PRIMARY KEY,
  enrollment_id BIGINT REFERENCES milady_rise_enrollments(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL DEFAULT 'Client Well-Being & Safety Certification',
  issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiration_date TIMESTAMPTZ NOT NULL, -- 2 years from issue
  certificate_url TEXT,
  certificate_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, revoked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scholarship applications table
CREATE TABLE IF NOT EXISTS milady_rise_scholarship_applications (
  id BIGSERIAL PRIMARY KEY,
  enrollment_id BIGINT REFERENCES milady_rise_enrollments(id) ON DELETE CASCADE,
  application_period TEXT NOT NULL, -- 'Spring 2025', 'Fall 2025', etc.
  application_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, under-review, awarded, not-awarded
  award_amount DECIMAL(10,2),
  award_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_milady_enrollments_email ON milady_rise_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_milady_enrollments_status ON milady_rise_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_milady_enrollments_date ON milady_rise_enrollments(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_milady_completions_enrollment ON milady_rise_completions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_milady_certifications_enrollment ON milady_rise_certifications(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_milady_scholarships_enrollment ON milady_rise_scholarship_applications(enrollment_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_milady_enrollments_updated_at
  BEFORE UPDATE ON milady_rise_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milady_scholarships_updated_at
  BEFORE UPDATE ON milady_rise_scholarship_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- View for reporting
CREATE OR REPLACE VIEW milady_rise_enrollment_stats AS
SELECT
  COUNT(*) as total_enrollments,
  COUNT(*) FILTER (WHERE status = 'active') as active_enrollments,
  COUNT(*) FILTER (WHERE certification_completed = TRUE) as completed_certifications,
  COUNT(*) FILTER (WHERE scholarship_eligible = TRUE) as scholarship_eligible,
  COUNT(*) FILTER (WHERE scholarship_applied = TRUE) as scholarship_applications,
  DATE_TRUNC('month', enrollment_date) as month
FROM milady_rise_enrollments
GROUP BY DATE_TRUNC('month', enrollment_date)
ORDER BY month DESC;

-- Comments
COMMENT ON TABLE milady_rise_enrollments IS 'Tracks student enrollments in Milady RISE program through EFH';
COMMENT ON TABLE milady_rise_completions IS 'Individual course completions within the certification bundle';
COMMENT ON TABLE milady_rise_certifications IS 'Final certifications issued upon completing all courses';
COMMENT ON TABLE milady_rise_scholarship_applications IS 'Scholarship applications from certified students';
COMMENT ON COLUMN milady_rise_enrollments.school_code IS 'EFH school code: efhcti-rise295 (1000 redemptions)';
