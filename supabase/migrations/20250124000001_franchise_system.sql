-- Franchise Tax Preparation System
-- Database schema for multi-office tax preparation business

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- FRANCHISE OFFICES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_code VARCHAR(20) UNIQUE NOT NULL,
  office_name VARCHAR(255) NOT NULL,
  
  -- Owner info
  owner_id UUID REFERENCES auth.users(id),
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  address_zip VARCHAR(10) NOT NULL,
  
  -- Business info
  business_ein VARCHAR(20),
  state_license VARCHAR(50),
  efin VARCHAR(6), -- Office's own EFIN if they have one
  parent_efin VARCHAR(6) NOT NULL, -- Franchise's master EFIN
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Franchise terms
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  per_return_fee DECIMAL(10,2) DEFAULT 5.00,
  revenue_share_percent DECIMAL(5,2) DEFAULT 0,
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Limits
  max_preparers INTEGER DEFAULT 10,
  max_returns_per_season INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ============================================
-- FRANCHISE PREPARERS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_preparers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  office_id UUID NOT NULL,
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- IRS credentials
  ptin VARCHAR(20) NOT NULL, -- P followed by 8 digits
  ptin_expiration DATE,
  
  -- Certifications
  certification_level VARCHAR(20) CHECK (certification_level IN ('basic', 'intermediate', 'advanced', 'supervisor')),
  certifications JSONB DEFAULT '[]',
  training_completed_at TIMESTAMPTZ,
  annual_refresher_due DATE,
  
  -- Authorizations
  is_efin_authorized BOOLEAN DEFAULT FALSE,
  is_ero_authorized BOOLEAN DEFAULT FALSE,
  signature_pin VARCHAR(10),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Performance metrics
  returns_filed INTEGER DEFAULT 0,
  returns_rejected INTEGER DEFAULT 0,
  average_refund DECIMAL(10,2),
  
  -- Compensation
  commission_type VARCHAR(20) DEFAULT 'per_return' CHECK (commission_type IN ('per_return', 'hourly', 'salary', 'commission')),
  per_return_fee DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  commission_rate DECIMAL(5,2), -- Percentage
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
  
  UNIQUE(office_id, ptin)
);

-- ============================================
-- FRANCHISE CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL,
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  
  -- Tax info
  filing_status VARCHAR(30),
  dependents_count INTEGER DEFAULT 0,
  
  -- SSN (encrypted)
  ssn_encrypted BYTEA,
  ssn_last_four VARCHAR(4),
  ssn_hash VARCHAR(64), -- For lookup without decryption
  
  -- Spouse info
  spouse_first_name VARCHAR(100),
  spouse_last_name VARCHAR(100),
  spouse_ssn_encrypted BYTEA,
  spouse_ssn_last_four VARCHAR(4),
  
  -- Preferences
  preferred_preparer_id UUID,
  
  -- History
  client_since DATE DEFAULT CURRENT_DATE,
  returns_filed INTEGER DEFAULT 0,
  total_fees_paid DECIMAL(10,2) DEFAULT 0,
  last_return_date DATE,
  last_return_id UUID,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'do_not_serve')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- ERO CONFIGURATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_ero_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL,
  ero_preparer_id UUID NOT NULL,
  
  -- ERO details
  efin VARCHAR(6) NOT NULL,
  firm_name VARCHAR(255) NOT NULL,
  firm_ein VARCHAR(20),
  firm_address JSONB NOT NULL,
  signature_pin VARCHAR(10) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RETURN SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_return_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  office_id UUID NOT NULL,
  preparer_id UUID NOT NULL,
  client_id UUID,
  
  -- Preparer info snapshot
  preparer_ptin VARCHAR(20) NOT NULL,
  preparer_name VARCHAR(255),
  
  -- ERO info
  ero_id UUID,
  ero_signature JSONB,
  ero_signed_at TIMESTAMPTZ,
  
  -- Return details
  tax_year INTEGER NOT NULL,
  efin VARCHAR(6) NOT NULL,
  return_type VARCHAR(20) DEFAULT 'IRS1040',
  filing_status VARCHAR(30),
  
  -- Return data (summary, not full return)
  return_data JSONB,
  taxpayer_ssn_hash VARCHAR(64),
  
  -- XML content
  xml_content TEXT,
  
  -- Fees
  client_fee DECIMAL(10,2) DEFAULT 0,
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  preparer_commission DECIMAL(10,2) DEFAULT 0,
  office_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_review', 'pending_ero', 'ready_to_submit',
    'submitted', 'accepted', 'rejected', 'error'
  )),
  
  -- IRS response
  irs_submission_id VARCHAR(50),
  irs_status VARCHAR(30),
  irs_status_date TIMESTAMPTZ,
  irs_errors JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  notes TEXT
);

-- ============================================
-- FEE SCHEDULES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_fee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Base fees
  base_fee_1040 DECIMAL(10,2) DEFAULT 150.00,
  base_fee_1040_ez DECIMAL(10,2) DEFAULT 75.00,
  
  -- Schedule fees
  fee_schedule_a DECIMAL(10,2) DEFAULT 50.00,
  fee_schedule_c DECIMAL(10,2) DEFAULT 100.00,
  fee_schedule_d DECIMAL(10,2) DEFAULT 50.00,
  fee_schedule_e DECIMAL(10,2) DEFAULT 75.00,
  fee_schedule_se DECIMAL(10,2) DEFAULT 25.00,
  
  -- Per-item fees
  fee_per_w2 DECIMAL(10,2) DEFAULT 0,
  fee_per_1099 DECIMAL(10,2) DEFAULT 15.00,
  fee_per_dependent DECIMAL(10,2) DEFAULT 25.00,
  
  -- State return
  fee_state_return DECIMAL(10,2) DEFAULT 50.00,
  
  -- Credits
  fee_eitc DECIMAL(10,2) DEFAULT 50.00,
  fee_ctc DECIMAL(10,2) DEFAULT 25.00,
  
  -- Bank products
  fee_refund_transfer DECIMAL(10,2) DEFAULT 35.00,
  fee_refund_advance DECIMAL(10,2) DEFAULT 0,
  
  -- Discounts
  returning_client_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  referral_discount DECIMAL(10,2) DEFAULT 25.00,
  senior_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  military_discount_percent DECIMAL(5,2) DEFAULT 15.00,
  
  -- Validity
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREPARER PAYOUTS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_preparer_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preparer_id UUID NOT NULL,
  office_id UUID NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Earnings
  returns_count INTEGER DEFAULT 0,
  gross_earnings DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_earnings DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
  
  -- Payment info
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- FRANCHISE ROYALTIES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_royalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amounts
  returns_count INTEGER DEFAULT 0,
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  per_return_fees DECIMAL(10,2) DEFAULT 0,
  revenue_share DECIMAL(10,2) DEFAULT 0,
  software_fees DECIMAL(10,2) DEFAULT 0,
  other_fees DECIMAL(10,2) DEFAULT 0,
  total_owed DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue')),
  
  -- Invoice info
  invoiced_at TIMESTAMPTZ,
  invoice_number VARCHAR(50),
  due_date DATE,
  
  -- Payment info
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Action info
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Context
  office_id UUID,
  actor_id UUID REFERENCES auth.users(id),
  
  -- Details
  details JSONB,
  old_values JSONB,
  new_values JSONB,
  
  -- Request info
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Offices
ALTER TABLE franchise_offices ADD COLUMN IF NOT EXISTS owner_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_offices_owner ON franchise_offices(owner_id);
ALTER TABLE franchise_offices ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_offices_status ON franchise_offices(status);
ALTER TABLE franchise_offices ADD COLUMN IF NOT EXISTS office_code TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_offices_code ON franchise_offices(office_code);

-- Preparers
ALTER TABLE franchise_preparers ADD COLUMN IF NOT EXISTS office_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_office ON franchise_preparers(office_id);
ALTER TABLE franchise_preparers ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_user ON franchise_preparers(user_id);
ALTER TABLE franchise_preparers ADD COLUMN IF NOT EXISTS ptin TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_ptin ON franchise_preparers(ptin);
ALTER TABLE franchise_preparers ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_status ON franchise_preparers(status);

-- Clients
ALTER TABLE franchise_clients ADD COLUMN IF NOT EXISTS office_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_clients_office ON franchise_clients(office_id);
ALTER TABLE franchise_clients ADD COLUMN IF NOT EXISTS ssn_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_clients_ssn_hash ON franchise_clients(ssn_hash);
CREATE INDEX IF NOT EXISTS idx_franchise_clients_name ON franchise_clients(last_name, first_name);

-- Return submissions
ALTER TABLE franchise_return_submissions ADD COLUMN IF NOT EXISTS office_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_returns_office ON franchise_return_submissions(office_id);
ALTER TABLE franchise_return_submissions ADD COLUMN IF NOT EXISTS preparer_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_returns_preparer ON franchise_return_submissions(preparer_id);
ALTER TABLE franchise_return_submissions ADD COLUMN IF NOT EXISTS client_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_returns_client ON franchise_return_submissions(client_id);
ALTER TABLE franchise_return_submissions ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_returns_status ON franchise_return_submissions(status);
ALTER TABLE franchise_return_submissions ADD COLUMN IF NOT EXISTS tax_year TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_returns_year ON franchise_return_submissions(tax_year);
ALTER TABLE franchise_return_submissions ADD COLUMN IF NOT EXISTS created_at TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_returns_created ON franchise_return_submissions(created_at);

-- Audit log
ALTER TABLE franchise_audit_log ADD COLUMN IF NOT EXISTS office_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_audit_office ON franchise_audit_log(office_id);
ALTER TABLE franchise_audit_log ADD COLUMN IF NOT EXISTS actor_id UUID;
CREATE INDEX IF NOT EXISTS idx_franchise_audit_actor ON franchise_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_franchise_audit_entity ON franchise_audit_log(entity_type, entity_id);
ALTER TABLE franchise_audit_log ADD COLUMN IF NOT EXISTS created_at TEXT;
CREATE INDEX IF NOT EXISTS idx_franchise_audit_created ON franchise_audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE franchise_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_preparers ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_ero_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_return_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_preparer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_audit_log ENABLE ROW LEVEL SECURITY;

-- Offices: Admins see all, owners see their own
DROP POLICY IF EXISTS "franchise_offices_admin" ON franchise_offices;
CREATE POLICY franchise_offices_admin ON franchise_offices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR owner_id = auth.uid()
  );

-- Preparers: Admins see all, office owners see their office's preparers, preparers see themselves
DROP POLICY IF EXISTS "franchise_preparers_access" ON franchise_preparers;
CREATE POLICY franchise_preparers_access ON franchise_preparers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Clients: Admins see all, office owners/preparers see their office's clients
DROP POLICY IF EXISTS "franchise_clients_access" ON franchise_clients;
CREATE POLICY franchise_clients_access ON franchise_clients
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE office_id = franchise_clients.office_id AND user_id = auth.uid())
  );

-- Returns: Similar to clients
DROP POLICY IF EXISTS "franchise_returns_access" ON franchise_return_submissions;
CREATE POLICY franchise_returns_access ON franchise_return_submissions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE id = preparer_id AND user_id = auth.uid())
  );

-- Audit log: Admins see all, office owners see their office's logs
DROP POLICY IF EXISTS "franchise_audit_access" ON franchise_audit_log;
CREATE POLICY franchise_audit_access ON franchise_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- ERO configs: Office owners and admins
DROP POLICY IF EXISTS "franchise_ero_configs_access" ON franchise_ero_configs;
CREATE POLICY franchise_ero_configs_access ON franchise_ero_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- Fee schedules: Office owners and admins
DROP POLICY IF EXISTS "franchise_fee_schedules_access" ON franchise_fee_schedules;
CREATE POLICY franchise_fee_schedules_access ON franchise_fee_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- Preparer payouts: Office owners and admins
DROP POLICY IF EXISTS "franchise_preparer_payouts_access" ON franchise_preparer_payouts;
CREATE POLICY franchise_preparer_payouts_access ON franchise_preparer_payouts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE id = preparer_id AND user_id = auth.uid())
  );

-- Royalties: Admins only (franchise-level data)
DROP POLICY IF EXISTS "franchise_royalties_access" ON franchise_royalties;
CREATE POLICY franchise_royalties_access ON franchise_royalties
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
DROP TRIGGER IF EXISTS update_franchise_offices_updated_at ON franchise_offices;
CREATE TRIGGER update_franchise_offices_updated_at
  BEFORE UPDATE ON franchise_offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_franchise_preparers_updated_at ON franchise_preparers;
CREATE TRIGGER update_franchise_preparers_updated_at
  BEFORE UPDATE ON franchise_preparers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_franchise_clients_updated_at ON franchise_clients;
CREATE TRIGGER update_franchise_clients_updated_at
  BEFORE UPDATE ON franchise_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_franchise_return_submissions_updated_at ON franchise_return_submissions;
CREATE TRIGGER update_franchise_return_submissions_updated_at
  BEFORE UPDATE ON franchise_return_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to encrypt SSN
CREATE OR REPLACE FUNCTION encrypt_ssn(ssn TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(ssn, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt SSN
CREATE OR REPLACE FUNCTION decrypt_ssn(encrypted_ssn BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_ssn, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash SSN for lookup
CREATE OR REPLACE FUNCTION hash_ssn(ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(regexp_replace(ssn, '[^0-9]', '', 'g'), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert default fee schedule template
-- INSERT INTO franchise_fee_schedules (office_id, name, is_default)
-- VALUES (NULL, 'Default Fee Schedule', TRUE);

COMMENT ON TABLE franchise_offices IS 'Tax preparation offices in the franchise network';
COMMENT ON TABLE franchise_preparers IS 'Tax preparers with PTINs working at franchise offices';
COMMENT ON TABLE franchise_clients IS 'Clients of franchise offices';
COMMENT ON TABLE franchise_return_submissions IS 'Tax returns prepared and submitted through the franchise';
COMMENT ON TABLE franchise_audit_log IS 'Audit trail for all franchise operations';
