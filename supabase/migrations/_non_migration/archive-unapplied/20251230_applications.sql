-- Applications Tables for SupersonicFastCash

-- Refund Advance Applications
CREATE TABLE IF NOT EXISTS refund_advance_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  requested_amount DECIMAL(10,2),
  purpose TEXT,
  annual_income DECIMAL(10,2),
  employment_status TEXT,
  status TEXT DEFAULT 'pending',
  approved_amount DECIMAL(10,2),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career Applications
CREATE TABLE IF NOT EXISTS career_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  has_ptin BOOLEAN DEFAULT false,
  has_efin BOOLEAN DEFAULT false,
  availability TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending',
  interviewed_at TIMESTAMPTZ,
  hired_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refund_advance_email ON refund_advance_applications(email);
CREATE INDEX IF NOT EXISTS idx_refund_advance_status ON refund_advance_applications(status);
CREATE INDEX IF NOT EXISTS idx_refund_advance_created ON refund_advance_applications(created_at);

CREATE INDEX IF NOT EXISTS idx_career_applications_email ON career_applications(email);
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON career_applications(status);
CREATE INDEX IF NOT EXISTS idx_career_applications_position ON career_applications(position);
CREATE INDEX IF NOT EXISTS idx_career_applications_created ON career_applications(created_at);

-- Row Level Security
ALTER TABLE refund_advance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refund_advance_applications
CREATE POLICY "Users can view own applications"
  ON refund_advance_applications FOR SELECT
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Users can insert own applications"
  ON refund_advance_applications FOR INSERT
  WITH CHECK (email = auth.jwt()->>'email');

CREATE POLICY "Service role can manage all applications"
  ON refund_advance_applications FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for career_applications
CREATE POLICY "Users can view own career applications"
  ON career_applications FOR SELECT
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Users can insert own career applications"
  ON career_applications FOR INSERT
  WITH CHECK (email = auth.jwt()->>'email');

CREATE POLICY "Service role can manage all career applications"
  ON career_applications FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Update triggers
CREATE TRIGGER update_refund_advance_applications_updated_at
  BEFORE UPDATE ON refund_advance_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_applications_updated_at
  BEFORE UPDATE ON career_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
