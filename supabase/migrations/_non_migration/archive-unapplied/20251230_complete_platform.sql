-- Complete SupersonicFastCash Platform Database Schema
-- All tables needed for 100% functionality

-- Clients table (if not exists)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  ssn TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  filing_status TEXT,
  jotform_submission_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Returns table
CREATE TABLE IF NOT EXISTS tax_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  service_type TEXT DEFAULT 'professional',
  status TEXT DEFAULT 'in_progress',
  drake_return_id TEXT,
  jotform_submission_id TEXT,
  has_w2 BOOLEAN DEFAULT false,
  has_1099 BOOLEAN DEFAULT false,
  has_self_employment BOOLEAN DEFAULT false,
  has_rental_income BOOLEAN DEFAULT false,
  wants_refund_advance BOOLEAN DEFAULT false,
  refund_method TEXT,
  federal_refund DECIMAL(10,2),
  state_refund DECIMAL(10,2),
  total_income DECIMAL(10,2),
  adjusted_gross_income DECIMAL(10,2),
  taxable_income DECIMAL(10,2),
  federal_tax DECIMAL(10,2),
  state_tax DECIMAL(10,2),
  filed_date TIMESTAMPTZ,
  accepted_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Calculations table (for calculator saves)
CREATE TABLE IF NOT EXISTS tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  total_income DECIMAL(10,2),
  adjusted_gross_income DECIMAL(10,2),
  taxable_income DECIMAL(10,2),
  federal_tax DECIMAL(10,2),
  total_tax DECIMAL(10,2),
  federal_withholding DECIMAL(10,2),
  estimated_refund DECIMAL(10,2),
  is_refund BOOLEAN,
  calculation_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income Sources table
CREATE TABLE IF NOT EXISTS income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  income_type TEXT NOT NULL,
  employer_name TEXT,
  ein TEXT,
  wages DECIMAL(10,2),
  federal_withholding DECIMAL(10,2),
  state_withholding DECIMAL(10,2),
  social_security_wages DECIMAL(10,2),
  medicare_wages DECIMAL(10,2),
  document_id UUID REFERENCES tax_documents(id),
  ocr_extracted BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dependents table
CREATE TABLE IF NOT EXISTS dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  relationship TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  routing_number TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refund Tracking table
CREATE TABLE IF NOT EXISTS refund_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  refund_type TEXT NOT NULL,
  expected_amount DECIMAL(10,2),
  actual_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  direct_deposit_date DATE,
  check_mailed_date DATE,
  received_date DATE,
  irs_status_code TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Consultations table
CREATE TABLE IF NOT EXISTS video_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  tax_return_id UUID REFERENCES tax_returns(id),
  meeting_url TEXT,
  meeting_id TEXT,
  meeting_password TEXT,
  provider TEXT DEFAULT 'zoom',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id),
  appointment_id UUID REFERENCES appointments(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_ssn ON clients(ssn);
CREATE INDEX IF NOT EXISTS idx_clients_jotform ON clients(jotform_submission_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_user_id ON tax_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_tax_year ON tax_returns(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON tax_returns(status);
CREATE INDEX IF NOT EXISTS idx_tax_returns_drake ON tax_returns(drake_return_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_id ON tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_email ON tax_calculations(user_email);
CREATE INDEX IF NOT EXISTS idx_income_sources_tax_return ON income_sources(tax_return_id);
CREATE INDEX IF NOT EXISTS idx_dependents_client_id ON dependents(client_id);
CREATE INDEX IF NOT EXISTS idx_refund_tracking_tax_return ON refund_tracking(tax_return_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_appointment ON video_consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tax_return ON payment_transactions(tax_return_id);

-- Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view own client data"
  ON clients FOR SELECT
  USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email');

CREATE POLICY "Service role can manage all clients"
  ON clients FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for tax_returns
CREATE POLICY "Users can view own tax returns"
  ON tax_returns FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM clients WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Service role can manage all tax returns"
  ON tax_returns FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for tax_calculations
CREATE POLICY "Users can view own calculations"
  ON tax_calculations FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can insert own calculations"
  ON tax_calculations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

-- RLS Policies for income_sources
CREATE POLICY "Users can view own income sources"
  ON income_sources FOR SELECT
  USING (
    tax_return_id IN (
      SELECT id FROM tax_returns WHERE user_id IN (
        SELECT id FROM clients WHERE email = auth.jwt()->>'email'
      )
    )
  );

-- RLS Policies for refund_tracking
CREATE POLICY "Users can view own refund tracking"
  ON refund_tracking FOR SELECT
  USING (
    tax_return_id IN (
      SELECT id FROM tax_returns WHERE user_id IN (
        SELECT id FROM clients WHERE email = auth.jwt()->>'email'
      )
    )
  );

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_returns_updated_at
  BEFORE UPDATE ON tax_returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_tracking_updated_at
  BEFORE UPDATE ON refund_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
