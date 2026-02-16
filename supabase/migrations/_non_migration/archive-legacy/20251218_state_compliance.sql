-- State-Specific Compliance Rules
-- Enables multi-state deployment with different requirements

CREATE TABLE IF NOT EXISTS public.state_compliance (
  state_code text PRIMARY KEY,
  state_name text NOT NULL,
  required_hours integer NOT NULL,
  classroom_hours integer,
  on_the_job_hours integer,
  exam_required boolean DEFAULT true,
  exam_provider text,
  license_board_url text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE state_compliance ENABLE ROW LEVEL SECURITY;

-- Anyone can view state compliance rules
CREATE POLICY "Anyone can view state compliance"
  ON state_compliance
  FOR SELECT
  TO authenticated, anon
  USING (active = true);

-- Only admins can manage state compliance
CREATE POLICY "Admins can manage state compliance"
  ON state_compliance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can manage state compliance
CREATE POLICY "Service role can manage state compliance"
  ON state_compliance
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_state_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER state_compliance_updated_at
  BEFORE UPDATE ON state_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_state_compliance_updated_at();

-- Seed initial state data
INSERT INTO state_compliance (state_code, state_name, required_hours, classroom_hours, on_the_job_hours, exam_provider, license_board_url)
VALUES
  ('IN', 'Indiana', 2000, 300, 1700, 'Indiana State Board of Barber Examiners', 'https://www.in.gov/pla/professions/barber-board/'),
  ('OH', 'Ohio', 1800, 200, 1600, 'Ohio State Barber Board', 'https://barber.ohio.gov/'),
  ('TX', 'Texas', 1500, 300, 1200, 'Texas Department of Licensing and Regulation', 'https://www.tdlr.texas.gov/barbers/barbers.htm'),
  ('IL', 'Illinois', 1500, 250, 1250, 'Illinois Department of Financial and Professional Regulation', 'https://www.idfpr.com/'),
  ('MI', 'Michigan', 2000, 400, 1600, 'Michigan Department of Licensing and Regulatory Affairs', 'https://www.michigan.gov/lara')
ON CONFLICT (state_code) DO NOTHING;

-- Comments
COMMENT ON TABLE state_compliance IS 'State-specific apprenticeship requirements for multi-state deployment';
COMMENT ON COLUMN state_compliance.required_hours IS 'Total hours required for program completion';
COMMENT ON COLUMN state_compliance.classroom_hours IS 'Minimum classroom/theory hours required';
COMMENT ON COLUMN state_compliance.on_the_job_hours IS 'Minimum on-the-job training hours required';
