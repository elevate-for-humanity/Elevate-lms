-- Funding & Reimbursement Tracking
-- WIOA, WRG, EARN & LEARN accountability

CREATE TABLE IF NOT EXISTS public.funding_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id),
  program_id uuid NOT NULL REFERENCES programs(id),
  enrollment_id uuid REFERENCES enrollments(id),
  funding_source text NOT NULL, -- WIOA, WRG, JRI, Employer, Pell, etc
  amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'paid', 'denied')),
  reference_id text,
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_funding_records_student ON funding_records(student_id);
CREATE INDEX IF NOT EXISTS idx_funding_records_program ON funding_records(program_id);
CREATE INDEX IF NOT EXISTS idx_funding_records_source ON funding_records(funding_source);
CREATE INDEX IF NOT EXISTS idx_funding_records_status ON funding_records(status);
CREATE INDEX IF NOT EXISTS idx_funding_records_created ON funding_records(created_at DESC);

-- RLS Policies
ALTER TABLE funding_records ENABLE ROW LEVEL SECURITY;

-- Students can view their own funding records
CREATE POLICY "Students can view their funding"
  ON funding_records
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Admins can view all funding records
CREATE POLICY "Admins can view all funding"
  ON funding_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can manage funding records
CREATE POLICY "Admins can manage funding"
  ON funding_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can manage funding
CREATE POLICY "Service role can manage funding"
  ON funding_records
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_funding_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER funding_records_updated_at
  BEFORE UPDATE ON funding_records
  FOR EACH ROW
  EXECUTE FUNCTION update_funding_records_updated_at();

-- View for funding summary
CREATE OR REPLACE VIEW funding_summary AS
SELECT
  funding_source,
  status,
  COUNT(*) as record_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM funding_records
GROUP BY funding_source, status;

-- Comments
COMMENT ON TABLE funding_records IS 'Tracks funding sources and reimbursement status for WIOA/WRG compliance';
COMMENT ON COLUMN funding_records.funding_source IS 'Source of funding (WIOA, WRG, JRI, Employer, etc)';
COMMENT ON COLUMN funding_records.status IS 'pending, submitted, approved, paid, denied';
COMMENT ON COLUMN funding_records.reference_id IS 'External reference number from funding agency';
