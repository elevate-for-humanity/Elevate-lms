-- Pre-add columns to existing tables
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mef_submissions') THEN
    ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS status TEXT;
    ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS tax_year INTEGER;
    ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS taxpayer_ssn_hash TEXT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tax_clients') THEN
    ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS ssn_hash TEXT;
    ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS user_id UUID;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tax_returns') THEN
    ALTER TABLE tax_returns ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE tax_returns ADD COLUMN IF NOT EXISTS status TEXT;
    ALTER TABLE tax_returns ADD COLUMN IF NOT EXISTS tax_year INTEGER;
  END IF;
END $$;

-- Supersonic Tax Software Database Schema
-- Direct IRS MeF Integration Tables

-- MeF Submissions table - stores all tax return submissions
CREATE TABLE IF NOT EXISTS mef_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  efin TEXT NOT NULL DEFAULT '358459',
  software_id TEXT,
  tax_year INTEGER NOT NULL,
  submission_type TEXT NOT NULL DEFAULT 'IRS1040',
  
  -- Taxpayer info (hashed for security)
  taxpayer_ssn_hash TEXT,
  taxpayer_name TEXT,
  
  -- Return data
  return_data JSONB,
  xml_content TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  dcn TEXT, -- Declaration Control Number (assigned by IRS on acceptance)
  
  -- Acknowledgment
  acknowledgment JSONB,
  
  -- Error handling
  error_message TEXT,
  resubmission_count INTEGER DEFAULT 0,
  original_submission_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  transmitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MeF Acknowledgments table - stores IRS responses
CREATE TABLE IF NOT EXISTS mef_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'accepted' or 'rejected'
  dcn TEXT, -- Declaration Control Number
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  errors JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MeF Errors table - detailed error logging
CREATE TABLE IF NOT EXISTS mef_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_category TEXT NOT NULL, -- 'reject' or 'alert'
  error_message TEXT NOT NULL,
  field_name TEXT,
  rule_number TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Returns table - client-facing return records
CREATE TABLE IF NOT EXISTS tax_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID,
  submission_id TEXT,
  
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  
  -- Calculated amounts
  total_income DECIMAL(12,2),
  adjusted_gross_income DECIMAL(12,2),
  taxable_income DECIMAL(12,2),
  total_tax DECIMAL(12,2),
  total_payments DECIMAL(12,2),
  refund_amount DECIMAL(12,2),
  amount_owed DECIMAL(12,2),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, transmitted, accepted, rejected
  dcn TEXT,
  
  -- Rejection info
  rejection_errors JSONB,
  rejected_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Preparer info
  preparer_id UUID,
  preparer_ptin TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  filed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Clients table - stores client information
CREATE TABLE IF NOT EXISTS tax_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Personal info
  first_name TEXT NOT NULL,
  middle_initial TEXT,
  last_name TEXT NOT NULL,
  ssn_hash TEXT NOT NULL, -- Hashed SSN
  ssn_last4 TEXT NOT NULL, -- Last 4 digits for display
  date_of_birth DATE NOT NULL,
  
  -- Contact
  email TEXT,
  phone TEXT,
  
  -- Address
  address_street TEXT,
  address_apartment TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  
  -- Spouse info (if applicable)
  spouse_first_name TEXT,
  spouse_last_name TEXT,
  spouse_ssn_hash TEXT,
  spouse_ssn_last4 TEXT,
  spouse_dob DATE,
  
  -- Bank info for direct deposit (encrypted)
  bank_routing_encrypted TEXT,
  bank_account_encrypted TEXT,
  bank_account_type TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Dependents table
CREATE TABLE IF NOT EXISTS tax_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID,
  client_id UUID,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn_hash TEXT NOT NULL,
  ssn_last4 TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  relationship TEXT NOT NULL,
  months_lived_with_taxpayer INTEGER DEFAULT 12,
  
  child_tax_credit_eligible BOOLEAN DEFAULT FALSE,
  other_dependent_credit_eligible BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- W2 Income table
CREATE TABLE IF NOT EXISTS tax_w2_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID,
  
  employer_ein TEXT NOT NULL,
  employer_name TEXT NOT NULL,
  employer_address_street TEXT,
  employer_address_city TEXT,
  employer_address_state TEXT,
  employer_address_zip TEXT,
  
  wages DECIMAL(12,2) NOT NULL, -- Box 1
  federal_withholding DECIMAL(12,2) DEFAULT 0, -- Box 2
  social_security_wages DECIMAL(12,2), -- Box 3
  social_security_tax DECIMAL(12,2), -- Box 4
  medicare_wages DECIMAL(12,2), -- Box 5
  medicare_tax DECIMAL(12,2), -- Box 6
  
  state_wages DECIMAL(12,2), -- Box 16
  state_withholding DECIMAL(12,2), -- Box 17
  state_code TEXT,
  state_employer_id TEXT,
  
  local_wages DECIMAL(12,2), -- Box 18
  local_withholding DECIMAL(12,2), -- Box 19
  locality_name TEXT,
  
  retirement_plan BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1099 Income table
CREATE TABLE IF NOT EXISTS tax_1099_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID,
  
  form_type TEXT NOT NULL, -- 'INT', 'DIV', 'MISC', 'NEC', 'R', 'G'
  payer_name TEXT NOT NULL,
  payer_ein TEXT,
  
  -- Common fields
  amount DECIMAL(12,2) NOT NULL,
  federal_withholding DECIMAL(12,2) DEFAULT 0,
  
  -- Type-specific fields stored as JSONB
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule C Business Income table
CREATE TABLE IF NOT EXISTS tax_schedule_c (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID,
  
  business_name TEXT NOT NULL,
  business_code TEXT NOT NULL, -- NAICS code
  ein TEXT,
  accounting_method TEXT DEFAULT 'cash',
  
  gross_receipts DECIMAL(12,2) NOT NULL,
  returns_allowances DECIMAL(12,2) DEFAULT 0,
  cost_of_goods_sold DECIMAL(12,2) DEFAULT 0,
  gross_profit DECIMAL(12,2),
  other_income DECIMAL(12,2) DEFAULT 0,
  
  -- Expenses
  expenses JSONB,
  total_expenses DECIMAL(12,2),
  
  net_profit DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itemized Deductions table
CREATE TABLE IF NOT EXISTS tax_itemized_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID,
  
  medical_expenses DECIMAL(12,2) DEFAULT 0,
  state_local_taxes DECIMAL(12,2) DEFAULT 0,
  real_estate_taxes DECIMAL(12,2) DEFAULT 0,
  personal_property_taxes DECIMAL(12,2) DEFAULT 0,
  mortgage_interest DECIMAL(12,2) DEFAULT 0,
  mortgage_insurance_premiums DECIMAL(12,2) DEFAULT 0,
  charitable_cash DECIMAL(12,2) DEFAULT 0,
  charitable_noncash DECIMAL(12,2) DEFAULT 0,
  casualty_losses DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  
  total_itemized DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_mef_submissions_user ON mef_submissions(user_id);
ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_mef_submissions_status ON mef_submissions(status);
ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS tax_year TEXT;
CREATE INDEX IF NOT EXISTS idx_mef_submissions_tax_year ON mef_submissions(tax_year);
ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS taxpayer_ssn_hash TEXT;
ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS taxpayer_ssn_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_mef_submissions_ssn_hash ON mef_submissions(taxpayer_ssn_hash);
ALTER TABLE tax_returns ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_tax_returns_user ON tax_returns(user_id);
ALTER TABLE tax_returns ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON tax_returns(status);
ALTER TABLE tax_returns ADD COLUMN IF NOT EXISTS tax_year TEXT;
CREATE INDEX IF NOT EXISTS idx_tax_returns_year ON tax_returns(tax_year);
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS ssn_hash TEXT;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS ssn_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_tax_clients_ssn_hash ON tax_clients(ssn_hash);
ALTER TABLE mef_errors ADD COLUMN IF NOT EXISTS submission_id UUID;
CREATE INDEX IF NOT EXISTS idx_mef_errors_submission ON mef_errors(submission_id);

-- Enable RLS
ALTER TABLE mef_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mef_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mef_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_w2_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_1099_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_schedule_c ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_itemized_deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON mef_submissions;
CREATE POLICY "Users can view own submissions" ON mef_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own tax returns
DROP POLICY IF EXISTS "Users can view own tax returns" ON tax_returns;
CREATE POLICY "Users can view own tax returns" ON tax_returns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tax returns" ON tax_returns;
CREATE POLICY "Users can insert own tax returns" ON tax_returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tax returns" ON tax_returns;
CREATE POLICY "Users can update own tax returns" ON tax_returns
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own client record
DROP POLICY IF EXISTS "Users can view own client record" ON tax_clients;
CREATE POLICY "Users can view own client record" ON tax_clients
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own client record" ON tax_clients;
CREATE POLICY "Users can insert own client record" ON tax_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own client record" ON tax_clients;
CREATE POLICY "Users can update own client record" ON tax_clients
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for tax preparers
DROP POLICY IF EXISTS "Admins can view all submissions" ON mef_submissions;
CREATE POLICY "Admins can view all submissions" ON mef_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

DROP POLICY IF EXISTS "Admins can insert submissions" ON mef_submissions;
CREATE POLICY "Admins can insert submissions" ON mef_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

DROP POLICY IF EXISTS "Admins can update submissions" ON mef_submissions;
CREATE POLICY "Admins can update submissions" ON mef_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

DROP POLICY IF EXISTS "Admins can view all tax returns" ON tax_returns;
CREATE POLICY "Admins can view all tax returns" ON tax_returns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

DROP POLICY IF EXISTS "Admins can view all clients" ON tax_clients;
CREATE POLICY "Admins can view all clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

-- Service role bypass for API operations
DROP POLICY IF EXISTS "Service role full access submissions" ON mef_submissions;
CREATE POLICY "Service role full access submissions" ON mef_submissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access acknowledgments" ON mef_acknowledgments;
CREATE POLICY "Service role full access acknowledgments" ON mef_acknowledgments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access errors" ON mef_errors;
CREATE POLICY "Service role full access errors" ON mef_errors
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

SELECT 'Tax software tables created successfully' AS result;
