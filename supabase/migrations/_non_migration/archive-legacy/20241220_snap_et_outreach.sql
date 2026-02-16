-- SNAP E&T Outreach Automation System
-- Created: December 20, 2024

-- Outreach log table
CREATE TABLE IF NOT EXISTS snap_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_org TEXT,
  recipient_name TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced', 'opened', 'replied')),
  triggered_by UUID REFERENCES auth.users(id),
  trigger_type TEXT CHECK (trigger_type IN ('manual', 'cron', 'program_flag', 'follow_up')),
  payload JSONB,
  follow_up_sent BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT FALSE,
  response_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_snap_outreach_email ON snap_outreach_log(recipient_email);
CREATE INDEX idx_snap_outreach_status ON snap_outreach_log(status);
CREATE INDEX idx_snap_outreach_sent_at ON snap_outreach_log(sent_at);

-- SNAP E&T contacts table
CREATE TABLE IF NOT EXISTS snap_et_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  title TEXT,
  agency_type TEXT CHECK (agency_type IN ('fssa', 'workone', 'dwd', 'workforce_board', 'intermediary', 'other')),
  county TEXT,
  region TEXT,
  active BOOLEAN DEFAULT TRUE,
  last_contacted TIMESTAMPTZ,
  contact_frequency TEXT DEFAULT 'quarterly' CHECK (contact_frequency IN ('weekly', 'monthly', 'quarterly', 'annual', 'as_needed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for contacts
CREATE INDEX idx_snap_contacts_email ON snap_et_contacts(email);
CREATE INDEX idx_snap_contacts_agency ON snap_et_contacts(agency_type);
CREATE INDEX idx_snap_contacts_active ON snap_et_contacts(active);

-- Program SNAP E&T eligibility flags
ALTER TABLE programs ADD COLUMN IF NOT EXISTS snap_et_eligible BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS snap_et_category TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS snap_et_hours_per_month INTEGER;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS snap_et_approved_date TIMESTAMPTZ;

-- Student SNAP E&T tracking
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_snap_recipient BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS snap_case_number TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS snap_et_start_date TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS snap_et_hours_required INTEGER DEFAULT 80;

-- Attendance SNAP E&T tagging
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS snap_et_activity_code TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS snap_et_verified BOOLEAN DEFAULT FALSE;

-- SNAP E&T monthly compliance reports
CREATE TABLE IF NOT EXISTS snap_et_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  report_month DATE NOT NULL,
  total_hours DECIMAL(10,2) DEFAULT 0,
  education_training_hours DECIMAL(10,2) DEFAULT 0,
  work_experience_hours DECIMAL(10,2) DEFAULT 0,
  job_readiness_hours DECIMAL(10,2) DEFAULT 0,
  job_search_hours DECIMAL(10,2) DEFAULT 0,
  barrier_support_hours DECIMAL(10,2) DEFAULT 0,
  attendance_percentage DECIMAL(5,2),
  compliant BOOLEAN DEFAULT FALSE,
  credential_earned BOOLEAN DEFAULT FALSE,
  credential_name TEXT,
  job_placement BOOLEAN DEFAULT FALSE,
  placement_date TIMESTAMPTZ,
  starting_wage DECIMAL(10,2),
  employer_name TEXT,
  exported_to_fssa BOOLEAN DEFAULT FALSE,
  export_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, report_month)
);

-- Index for monthly reports
CREATE INDEX idx_snap_monthly_student ON snap_et_monthly_reports(student_id);
CREATE INDEX idx_snap_monthly_month ON snap_et_monthly_reports(report_month);
CREATE INDEX idx_snap_monthly_compliant ON snap_et_monthly_reports(compliant);

-- Insert default SNAP E&T contacts
INSERT INTO snap_et_contacts (organization, contact_name, email, agency_type, notes) VALUES
  ('Indiana FSSA - Division of Family Resources', 'SNAP E&T Coordinator', 'SNAPEET@fssa.in.gov', 'fssa', 'Primary state SNAP E&T contact'),
  ('Indiana FSSA - SNAP Policy', 'Policy Director', 'SNAPPolicy@fssa.in.gov', 'fssa', 'SNAP policy and compliance'),
  ('Indiana Department of Workforce Development', 'WIOA Director', 'dwd@dwd.in.gov', 'dwd', 'WIOA coordination'),
  ('WorkOne Indianapolis - EmployIndy', 'Workforce Development Director', 'info@employindy.org', 'workone', 'Marion County workforce board'),
  ('WorkOne Central Indiana', 'Regional Director', 'info@workonecentral.com', 'workone', 'Central Indiana region')
ON CONFLICT (email) DO NOTHING;

-- Function to calculate monthly SNAP E&T hours
CREATE OR REPLACE FUNCTION calculate_snap_et_monthly_hours(
  p_student_id UUID,
  p_month DATE
)
RETURNS TABLE (
  total_hours DECIMAL,
  education_training DECIMAL,
  work_experience DECIMAL,
  job_readiness DECIMAL,
  job_search DECIMAL,
  barrier_support DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(a.hours), 0) as total_hours,
    COALESCE(SUM(CASE WHEN a.snap_et_activity_code = 'ET' THEN a.hours ELSE 0 END), 0) as education_training,
    COALESCE(SUM(CASE WHEN a.snap_et_activity_code = 'WE' THEN a.hours ELSE 0 END), 0) as work_experience,
    COALESCE(SUM(CASE WHEN a.snap_et_activity_code = 'JR' THEN a.hours ELSE 0 END), 0) as job_readiness,
    COALESCE(SUM(CASE WHEN a.snap_et_activity_code = 'JS' THEN a.hours ELSE 0 END), 0) as job_search,
    COALESCE(SUM(CASE WHEN a.snap_et_activity_code = 'BS' THEN a.hours ELSE 0 END), 0) as barrier_support
  FROM attendance a
  WHERE a.student_id = p_student_id
    AND DATE_TRUNC('month', a.date) = DATE_TRUNC('month', p_month)
    AND a.snap_et_verified = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate monthly SNAP E&T report
CREATE OR REPLACE FUNCTION generate_snap_et_monthly_report(
  p_student_id UUID,
  p_month DATE
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_hours RECORD;
  v_total_hours DECIMAL;
  v_attendance_pct DECIMAL;
BEGIN
  -- Calculate hours
  SELECT * INTO v_hours FROM calculate_snap_et_monthly_hours(p_student_id, p_month);
  
  v_total_hours := v_hours.total_hours;
  
  -- Calculate attendance percentage
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0 
    END INTO v_attendance_pct
  FROM attendance
  WHERE student_id = p_student_id
    AND DATE_TRUNC('month', date) = DATE_TRUNC('month', p_month);
  
  -- Insert or update report
  INSERT INTO snap_et_monthly_reports (
    student_id,
    report_month,
    total_hours,
    education_training_hours,
    work_experience_hours,
    job_readiness_hours,
    job_search_hours,
    barrier_support_hours,
    attendance_percentage,
    compliant
  ) VALUES (
    p_student_id,
    DATE_TRUNC('month', p_month),
    v_total_hours,
    v_hours.education_training,
    v_hours.work_experience,
    v_hours.job_readiness,
    v_hours.job_search,
    v_hours.barrier_support,
    v_attendance_pct,
    v_total_hours >= 80
  )
  ON CONFLICT (student_id, report_month) 
  DO UPDATE SET
    total_hours = EXCLUDED.total_hours,
    education_training_hours = EXCLUDED.education_training_hours,
    work_experience_hours = EXCLUDED.work_experience_hours,
    job_readiness_hours = EXCLUDED.job_readiness_hours,
    job_search_hours = EXCLUDED.job_search_hours,
    barrier_support_hours = EXCLUDED.barrier_support_hours,
    attendance_percentage = EXCLUDED.attendance_percentage,
    compliant = EXCLUDED.compliant,
    updated_at = NOW()
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE snap_outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE snap_et_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE snap_et_monthly_reports ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage SNAP outreach" ON snap_outreach_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage SNAP contacts" ON snap_et_contacts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view SNAP reports" ON snap_et_monthly_reports
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Students can view their own reports
CREATE POLICY "Students can view own SNAP reports" ON snap_et_monthly_reports
  FOR SELECT USING (student_id = auth.uid());

-- Comments
COMMENT ON TABLE snap_outreach_log IS 'Tracks all SNAP E&T outreach emails sent to agencies';
COMMENT ON TABLE snap_et_contacts IS 'SNAP E&T agency contacts for automated outreach';
COMMENT ON TABLE snap_et_monthly_reports IS 'Monthly SNAP E&T compliance reports for participants';
COMMENT ON FUNCTION calculate_snap_et_monthly_hours IS 'Calculates SNAP E&T hours by activity type for a student/month';
COMMENT ON FUNCTION generate_snap_et_monthly_report IS 'Generates or updates monthly SNAP E&T compliance report';
