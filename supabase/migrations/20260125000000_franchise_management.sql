-- Franchise Tax Office Management Schema
-- Supports multi-office, multi-preparer tax preparation business

-- ============================================
-- FRANCHISE OFFICES
-- ============================================

CREATE TABLE IF NOT EXISTS tax_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Office identification
  office_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "IND-001", "CHI-002"
  office_name VARCHAR(255) NOT NULL,
  
  -- Owner/franchisee
  owner_id UUID REFERENCES auth.users(id),
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20),
  
  -- Location
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  address_zip VARCHAR(10) NOT NULL,
  
  -- Business details
  business_ein VARCHAR(20), -- Office's own EIN if applicable
  state_license VARCHAR(50), -- State tax preparer license if required
  
  -- ERO relationship (all offices operate under main EFIN)
  parent_efin VARCHAR(6) NOT NULL DEFAULT '358459',
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, terminated
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Franchise terms
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  per_return_fee DECIMAL(10,2) DEFAULT 5.00, -- Fee per return to franchisor
  revenue_share_percent DECIMAL(5,2) DEFAULT 0, -- Alternative to per-return fee
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Limits
  max_preparers INTEGER DEFAULT 10,
  max_returns_per_season INTEGER, -- NULL = unlimited
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ============================================
-- TAX PREPARERS
-- ============================================

CREATE TABLE IF NOT EXISTS tax_preparers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User link
  user_id UUID REFERENCES auth.users(id),
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- IRS credentials
  ptin VARCHAR(20) NOT NULL, -- P01234567 format
  ptin_expiration DATE,
  
  -- Office assignment
  office_id UUID,
  
  -- Certification/training
  certification_level VARCHAR(50), -- basic, intermediate, advanced, supervisor
  certifications JSONB DEFAULT '[]', -- Array of certifications with dates
  training_completed_at TIMESTAMPTZ,
  annual_refresher_due DATE,
  
  -- IRS requirements
  efin_authorized BOOLEAN DEFAULT FALSE, -- Authorized to use office EFIN
  ero_authorized BOOLEAN DEFAULT FALSE, -- Can sign as ERO (usually only owner)
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, terminated
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Performance tracking
  returns_prepared_lifetime INTEGER DEFAULT 0,
  returns_prepared_current_season INTEGER DEFAULT 0,
  rejection_rate DECIMAL(5,2) DEFAULT 0,
  average_refund DECIMAL(12,2),
  
  -- Compensation
  compensation_type VARCHAR(20) DEFAULT 'per_return', -- per_return, hourly, salary, commission
  per_return_rate DECIMAL(10,2), -- Amount paid per return
  hourly_rate DECIMAL(10,2),
  commission_percent DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  UNIQUE(ptin),
  UNIQUE(email)
);

-- ============================================
-- TAX RETURN ASSIGNMENTS
-- ============================================

-- Extend mef_submissions to track preparer/office
ALTER TABLE mef_submissions 
ADD COLUMN IF NOT EXISTS office_id UUID,
ADD COLUMN IF NOT EXISTS preparer_id UUID,
ADD COLUMN IF NOT EXISTS ero_id UUID, -- Who signed as ERO
ADD COLUMN IF NOT EXISTS preparer_ptin VARCHAR(20),
ADD COLUMN IF NOT EXISTS client_fee DECIMAL(10,2), -- What client paid
ADD COLUMN IF NOT EXISTS franchise_fee DECIMAL(10,2), -- Fee to franchisor
ADD COLUMN IF NOT EXISTS preparer_commission DECIMAL(10,2), -- Preparer's cut
ADD COLUMN IF NOT EXISTS office_revenue DECIMAL(10,2); -- Office's cut

-- ============================================
-- CLIENT MANAGEMENT (per office)
-- ============================================

-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql] CREATE TABLE IF NOT EXISTS tax_clients (
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Office relationship
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   office_id UUID NOT NULL,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Client info (encrypted SSN stored separately)
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   first_name VARCHAR(100) NOT NULL,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   last_name VARCHAR(100) NOT NULL,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   email VARCHAR(255),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   phone VARCHAR(20),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Address
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   address_street VARCHAR(255),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   address_city VARCHAR(100),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   address_state VARCHAR(2),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   address_zip VARCHAR(10),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Tax info (non-sensitive)
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   filing_status VARCHAR(50),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   dependents_count INTEGER DEFAULT 0,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Encrypted sensitive data reference
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   ssn_encrypted TEXT, -- Encrypted SSN
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   ssn_last_four VARCHAR(4), -- For display/lookup
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Spouse info (if MFJ)
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   spouse_first_name VARCHAR(100),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   spouse_last_name VARCHAR(100),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   spouse_ssn_encrypted TEXT,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   spouse_ssn_last_four VARCHAR(4),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Preferred preparer
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   preferred_preparer_id UUID,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- History
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   client_since DATE DEFAULT CURRENT_DATE,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   returns_filed INTEGER DEFAULT 0,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   total_fees_paid DECIMAL(12,2) DEFAULT 0,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   last_return_date DATE,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   last_return_id UUID,
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Status
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   status VARCHAR(20) DEFAULT 'active', -- active, inactive, do_not_serve
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   -- Metadata
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   created_at TIMESTAMPTZ DEFAULT NOW(),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   updated_at TIMESTAMPTZ DEFAULT NOW(),
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql]   notes TEXT
-- [DUPLICATE: canonical in 20260124150000_tax_software_tables.sql] );
-- If table already exists from 20260124150000, add columns unique to this schema
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS office_id UUID;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS filing_status VARCHAR(50);
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS dependents_count INTEGER DEFAULT 0;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS ssn_encrypted TEXT;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS ssn_last_four VARCHAR(4);
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS spouse_ssn_encrypted TEXT;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS spouse_ssn_last_four VARCHAR(4);
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS preferred_preparer_id UUID;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS client_since DATE DEFAULT CURRENT_DATE;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS returns_filed INTEGER DEFAULT 0;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS total_fees_paid DECIMAL(12,2) DEFAULT 0;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS last_return_date DATE;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS last_return_id UUID;
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- FEE SCHEDULE (per office customizable)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  office_id UUID,
  
  -- Fee structure
  name VARCHAR(100) NOT NULL, -- e.g., "Standard 2026", "Premium"
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Base fees
  base_fee_1040 DECIMAL(10,2) DEFAULT 75.00,
  base_fee_1040_ez DECIMAL(10,2) DEFAULT 50.00,
  
  -- Add-on fees
  fee_schedule_a DECIMAL(10,2) DEFAULT 25.00, -- Itemized deductions
  fee_schedule_c DECIMAL(10,2) DEFAULT 75.00, -- Business income
  fee_schedule_d DECIMAL(10,2) DEFAULT 35.00, -- Capital gains
  fee_schedule_e DECIMAL(10,2) DEFAULT 50.00, -- Rental income
  fee_schedule_se DECIMAL(10,2) DEFAULT 25.00, -- Self-employment tax
  fee_per_w2 DECIMAL(10,2) DEFAULT 0, -- Per W-2 after first
  fee_per_1099 DECIMAL(10,2) DEFAULT 15.00, -- Per 1099
  fee_per_dependent DECIMAL(10,2) DEFAULT 10.00,
  fee_state_return DECIMAL(10,2) DEFAULT 45.00,
  fee_eitc DECIMAL(10,2) DEFAULT 0, -- EITC add-on
  fee_ctc DECIMAL(10,2) DEFAULT 0, -- Child tax credit add-on
  
  -- Bank products
  fee_refund_transfer DECIMAL(10,2) DEFAULT 40.00,
  fee_refund_advance DECIMAL(10,2) DEFAULT 0, -- If offering RALs
  
  -- Discounts
  returning_client_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  referral_discount DECIMAL(10,2) DEFAULT 20.00,
  senior_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  military_discount_percent DECIMAL(5,2) DEFAULT 15.00,
  
  -- Effective dates
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMISSION/PAYOUT TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS preparer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  preparer_id UUID NOT NULL,
  office_id UUID NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Earnings
  returns_count INTEGER DEFAULT 0,
  gross_earnings DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0, -- Chargebacks, errors, etc.
  net_earnings DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, disputed
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50), -- check, direct_deposit, cash
  payment_reference VARCHAR(100), -- Check number, transaction ID
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- FRANCHISE FEES/ROYALTIES
-- ============================================

-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql] CREATE TABLE IF NOT EXISTS franchise_royalties (
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   office_id UUID NOT NULL,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   -- Period
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   period_start DATE NOT NULL,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   period_end DATE NOT NULL,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   -- Activity
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   returns_count INTEGER DEFAULT 0,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   gross_revenue DECIMAL(12,2) DEFAULT 0,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   -- Fees owed to franchisor
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   per_return_fees DECIMAL(12,2) DEFAULT 0,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   revenue_share DECIMAL(12,2) DEFAULT 0,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   software_fees DECIMAL(12,2) DEFAULT 0,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   other_fees DECIMAL(12,2) DEFAULT 0,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   total_owed DECIMAL(12,2) DEFAULT 0,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   -- Payment
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   status VARCHAR(20) DEFAULT 'pending', -- pending, invoiced, paid, overdue
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   invoiced_at TIMESTAMPTZ,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   invoice_number VARCHAR(50),
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   due_date DATE,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   paid_at TIMESTAMPTZ,
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   payment_reference VARCHAR(100),
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   created_at TIMESTAMPTZ DEFAULT NOW(),
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql]   updated_at TIMESTAMPTZ DEFAULT NOW()
-- [DUPLICATE: canonical in 20250124000001_franchise_system.sql] );

-- ============================================
-- AUDIT LOG (for compliance)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened
  event_type VARCHAR(50) NOT NULL, -- return_created, return_submitted, return_rejected, client_created, etc.
  event_description TEXT,
  
  -- Who
  user_id UUID REFERENCES auth.users(id),
  preparer_id UUID,
  office_id UUID,
  
  -- What entity
  entity_type VARCHAR(50), -- submission, client, preparer, office
  entity_id UUID,
  
  -- Details
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

ALTER TABLE tax_offices ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_tax_offices_status ON tax_offices(status);
ALTER TABLE tax_offices ADD COLUMN IF NOT EXISTS owner_id UUID;
CREATE INDEX IF NOT EXISTS idx_tax_offices_owner ON tax_offices(owner_id);

ALTER TABLE tax_preparers ADD COLUMN IF NOT EXISTS office_id UUID;
CREATE INDEX IF NOT EXISTS idx_tax_preparers_office ON tax_preparers(office_id);
ALTER TABLE tax_preparers ADD COLUMN IF NOT EXISTS ptin TEXT;
CREATE INDEX IF NOT EXISTS idx_tax_preparers_ptin ON tax_preparers(ptin);
ALTER TABLE tax_preparers ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_tax_preparers_status ON tax_preparers(status);

ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS office_id UUID;
CREATE INDEX IF NOT EXISTS idx_tax_clients_office ON tax_clients(office_id);
ALTER TABLE tax_clients ADD COLUMN IF NOT EXISTS ssn_last_four TEXT;
CREATE INDEX IF NOT EXISTS idx_tax_clients_ssn_last_four ON tax_clients(ssn_last_four);
CREATE INDEX IF NOT EXISTS idx_tax_clients_name ON tax_clients(last_name, first_name);

ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS office_id UUID;
CREATE INDEX IF NOT EXISTS idx_mef_submissions_office ON mef_submissions(office_id);
ALTER TABLE mef_submissions ADD COLUMN IF NOT EXISTS preparer_id UUID;
CREATE INDEX IF NOT EXISTS idx_mef_submissions_preparer ON mef_submissions(preparer_id);

ALTER TABLE tax_audit_log ADD COLUMN IF NOT EXISTS event_type TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_log_event ON tax_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON tax_audit_log(entity_type, entity_id);
ALTER TABLE tax_audit_log ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON tax_audit_log(user_id);
ALTER TABLE tax_audit_log ADD COLUMN IF NOT EXISTS created_at TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON tax_audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE tax_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_preparers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_audit_log ENABLE ROW LEVEL SECURITY;

-- Franchise admin (you) can see everything
DROP POLICY IF EXISTS "Franchise admin full access to offices" ON tax_offices;
CREATE POLICY "Franchise admin full access to offices" ON tax_offices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

-- Office owners can see their own office
DROP POLICY IF EXISTS "Office owners can view own office" ON tax_offices;
CREATE POLICY "Office owners can view own office" ON tax_offices
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Office owners can update own office" ON tax_offices;
CREATE POLICY "Office owners can update own office" ON tax_offices
  FOR UPDATE USING (owner_id = auth.uid());

-- Preparers: office owners and admins can manage
DROP POLICY IF EXISTS "Admins full access to preparers" ON tax_preparers;
CREATE POLICY "Admins full access to preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

DROP POLICY IF EXISTS "Office owners can manage their preparers" ON tax_preparers;
CREATE POLICY "Office owners can manage their preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tax_offices 
      WHERE tax_offices.id = tax_preparers.office_id 
      AND tax_offices.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Preparers can view own record" ON tax_preparers;
CREATE POLICY "Preparers can view own record" ON tax_preparers
  FOR SELECT USING (user_id = auth.uid());

-- Clients: office staff can access their office's clients
DROP POLICY IF EXISTS "Admins full access to clients" ON tax_clients;
CREATE POLICY "Admins full access to clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

DROP POLICY IF EXISTS "Office staff can access office clients" ON tax_clients;
CREATE POLICY "Office staff can access office clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tax_preparers 
      WHERE tax_preparers.office_id = tax_clients.office_id 
      AND tax_preparers.user_id = auth.uid()
      AND tax_preparers.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM tax_offices 
      WHERE tax_offices.id = tax_clients.office_id 
      AND tax_offices.owner_id = auth.uid()
    )
  );

-- Audit log: admins only
DROP POLICY IF EXISTS "Admins can view audit log" ON tax_audit_log;
CREATE POLICY "Admins can view audit log" ON tax_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

-- Anyone can insert audit log entries
DROP POLICY IF EXISTS "Anyone can create audit entries" ON tax_audit_log;
CREATE POLICY "Anyone can create audit entries" ON tax_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tax_offices_updated_at
  BEFORE UPDATE ON tax_offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tax_preparers_updated_at
  BEFORE UPDATE ON tax_preparers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tax_clients_updated_at
  BEFORE UPDATE ON tax_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate return fees
CREATE OR REPLACE FUNCTION calculate_return_fee(
  p_office_id UUID,
  p_has_schedule_a BOOLEAN DEFAULT FALSE,
  p_has_schedule_c BOOLEAN DEFAULT FALSE,
  p_has_schedule_d BOOLEAN DEFAULT FALSE,
  p_has_schedule_e BOOLEAN DEFAULT FALSE,
  p_w2_count INTEGER DEFAULT 1,
  p_1099_count INTEGER DEFAULT 0,
  p_dependent_count INTEGER DEFAULT 0,
  p_has_state BOOLEAN DEFAULT FALSE,
  p_is_returning_client BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL AS $$
DECLARE
  v_fee_schedule tax_fee_schedules%ROWTYPE;
  v_total DECIMAL := 0;
BEGIN
  -- Get active fee schedule for office
  SELECT * INTO v_fee_schedule
  FROM tax_fee_schedules
  WHERE office_id = p_office_id
    AND is_default = TRUE
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Use base defaults
    v_total := 75.00;
  ELSE
    -- Base fee
    v_total := v_fee_schedule.base_fee_1040;
    
    -- Schedule add-ons
    IF p_has_schedule_a THEN v_total := v_total + v_fee_schedule.fee_schedule_a; END IF;
    IF p_has_schedule_c THEN v_total := v_total + v_fee_schedule.fee_schedule_c; END IF;
    IF p_has_schedule_d THEN v_total := v_total + v_fee_schedule.fee_schedule_d; END IF;
    IF p_has_schedule_e THEN v_total := v_total + v_fee_schedule.fee_schedule_e; END IF;
    
    -- Per-item fees
    IF p_w2_count > 1 THEN 
      v_total := v_total + (v_fee_schedule.fee_per_w2 * (p_w2_count - 1)); 
    END IF;
    v_total := v_total + (v_fee_schedule.fee_per_1099 * p_1099_count);
    v_total := v_total + (v_fee_schedule.fee_per_dependent * p_dependent_count);
    
    -- State return
    IF p_has_state THEN v_total := v_total + v_fee_schedule.fee_state_return; END IF;
    
    -- Returning client discount
    IF p_is_returning_client THEN
      v_total := v_total * (1 - v_fee_schedule.returning_client_discount_percent / 100);
    END IF;
  END IF;
  
  RETURN ROUND(v_total, 2);
END;
$$ LANGUAGE plpgsql;

-- Log audit event
CREATE OR REPLACE FUNCTION log_tax_audit_event(
  p_event_type VARCHAR(50),
  p_event_description TEXT,
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_preparer_id UUID;
  v_office_id UUID;
BEGIN
  -- Try to get preparer/office context
  SELECT id, office_id INTO v_preparer_id, v_office_id
  FROM tax_preparers
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  INSERT INTO tax_audit_log (
    event_type, event_description, user_id, preparer_id, office_id,
    entity_type, entity_id, old_values, new_values
  ) VALUES (
    p_event_type, p_event_description, auth.uid(), v_preparer_id, v_office_id,
    p_entity_type, p_entity_id, p_old_values, p_new_values
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
