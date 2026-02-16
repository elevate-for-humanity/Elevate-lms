-- =====================================================
-- PAYROLL CARDS SYSTEM - REVENUE GENERATING PRODUCT
-- =====================================================
-- Created: 2025-11-29
-- Purpose: Prepaid payroll debit card product with fee revenue tracking
-- Business Model: Issue cards, earn fees on loads, transactions, ATM withdrawals
-- =====================================================

-- Card Programs (Different card products you offer)
CREATE TABLE IF NOT EXISTS payroll_card_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Program Details
  program_name VARCHAR(255) NOT NULL,
  program_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  card_provider VARCHAR(100) NOT NULL, -- Your bank/processor partner
  bin_number VARCHAR(6), -- Bank Identification Number
  
  -- Fee Structure (Your Revenue)
  activation_fee DECIMAL(10,2) DEFAULT 0,
  monthly_maintenance_fee DECIMAL(10,2) DEFAULT 0,
  load_fee_percentage DECIMAL(5,2) DEFAULT 0, -- % of each load
  load_fee_flat DECIMAL(10,2) DEFAULT 0, -- Flat fee per load
  atm_withdrawal_fee DECIMAL(10,2) DEFAULT 2.50,
  pos_purchase_fee DECIMAL(10,2) DEFAULT 0,
  balance_inquiry_fee DECIMAL(10,2) DEFAULT 0.50,
  replacement_card_fee DECIMAL(10,2) DEFAULT 5.00,
  inactivity_fee DECIMAL(10,2) DEFAULT 0,
  inactivity_months INTEGER DEFAULT 6,
  
  -- Revenue Share (if partnering with processor)
  revenue_share_percentage DECIMAL(5,2) DEFAULT 100, -- % you keep
  processor_share_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Program Status
  is_active BOOLEAN DEFAULT true,
  launch_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default program
INSERT INTO payroll_card_programs (program_name, program_code, card_provider, activation_fee, monthly_maintenance_fee, load_fee_flat, atm_withdrawal_fee, replacement_card_fee)
VALUES ('Elevate Payroll Card', 'EPC-001', 'Partner Bank', 0, 4.95, 1.50, 2.50, 5.00)
ON CONFLICT (program_code) DO NOTHING;

-- Payroll Cards Table
CREATE TABLE IF NOT EXISTS payroll_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Program Association
  program_id UUID REFERENCES payroll_card_programs(id) NOT NULL,
  
  -- Card Details
  card_number_last_four VARCHAR(4) NOT NULL,
  card_holder_name VARCHAR(255) NOT NULL,
  card_status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, cancelled, expired
  
  -- Employee Association
  employee_id UUID REFERENCES employees(id),
  profile_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES students(id),
  
  -- Card Lifecycle
  issued_date DATE,
  activation_date DATE,
  expiration_date DATE,
  cancelled_date DATE,
  cancellation_reason TEXT,
  
  -- Card Limits
  daily_limit DECIMAL(10,2),
  monthly_limit DECIMAL(10,2),
  per_transaction_limit DECIMAL(10,2),
  
  -- Revenue Tracking (Your Income from this card)
  total_revenue_earned DECIMAL(15,2) DEFAULT 0,
  total_activation_fees DECIMAL(15,2) DEFAULT 0,
  total_monthly_fees DECIMAL(15,2) DEFAULT 0,
  total_load_fees DECIMAL(15,2) DEFAULT 0,
  total_atm_fees DECIMAL(15,2) DEFAULT 0,
  total_transaction_fees DECIMAL(15,2) DEFAULT 0,
  total_other_fees DECIMAL(15,2) DEFAULT 0,
  
  -- Card Usage Tracking
  total_loaded DECIMAL(15,2) DEFAULT 0,
  total_spent DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  load_count INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  atm_withdrawal_count INTEGER DEFAULT 0,
  last_transaction_date TIMESTAMPTZ,
  last_fee_charged_date TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card Transactions Table
CREATE TABLE IF NOT EXISTS payroll_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES payroll_cards(id) NOT NULL,
  
  -- Transaction Details
  transaction_type VARCHAR(50) NOT NULL, -- load, purchase, atm_withdrawal, fee, refund, monthly_fee, activation_fee
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  merchant_name VARCHAR(255),
  merchant_category VARCHAR(100),
  
  -- Fee/Revenue Tracking (Your Income)
  fee_charged DECIMAL(10,2) DEFAULT 0,
  fee_type VARCHAR(50), -- load_fee, atm_fee, monthly_fee, activation_fee, etc.
  revenue_earned DECIMAL(10,2) DEFAULT 0, -- After revenue share
  processor_share DECIMAL(10,2) DEFAULT 0,
  
  -- Transaction Status
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed, reversed
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  posted_date TIMESTAMPTZ,
  
  -- Balance Tracking
  balance_before DECIMAL(10,2),
  balance_after DECIMAL(10,2),
  
  -- Reference
  reference_number VARCHAR(100),
  payroll_run_id UUID REFERENCES payroll_runs(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card Load Requests Table
CREATE TABLE IF NOT EXISTS payroll_card_load_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES payroll_cards(id) NOT NULL,
  
  -- Load Details
  amount DECIMAL(10,2) NOT NULL,
  load_type VARCHAR(50) NOT NULL, -- payroll, bonus, reimbursement, manual
  description TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, processing, completed, failed, cancelled
  requested_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  processed_by UUID REFERENCES profiles(id),
  
  -- Dates
  requested_date TIMESTAMPTZ DEFAULT NOW(),
  approved_date TIMESTAMPTZ,
  processed_date TIMESTAMPTZ,
  
  -- Reference
  payroll_run_id UUID REFERENCES payroll_runs(id),
  reference_number VARCHAR(100),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card Disputes Table
CREATE TABLE IF NOT EXISTS payroll_card_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES payroll_cards(id) NOT NULL,
  transaction_id UUID REFERENCES payroll_card_transactions(id),
  
  -- Dispute Details
  dispute_type VARCHAR(50) NOT NULL, -- unauthorized, incorrect_amount, duplicate, other
  disputed_amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, denied, closed
  resolution TEXT,
  
  -- Dates
  filed_date TIMESTAMPTZ DEFAULT NOW(),
  resolved_date TIMESTAMPTZ,
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card Revenue Summary (Daily/Monthly aggregates)
CREATE TABLE IF NOT EXISTS payroll_card_revenue_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time Period
  summary_date DATE NOT NULL,
  summary_type VARCHAR(20) NOT NULL, -- daily, monthly, yearly
  
  -- Program
  program_id UUID REFERENCES payroll_card_programs(id),
  
  -- Card Metrics
  active_cards INTEGER DEFAULT 0,
  new_cards_issued INTEGER DEFAULT 0,
  cards_cancelled INTEGER DEFAULT 0,
  
  -- Transaction Volume
  total_loads DECIMAL(15,2) DEFAULT 0,
  total_loads_count INTEGER DEFAULT 0,
  total_purchases DECIMAL(15,2) DEFAULT 0,
  total_purchases_count INTEGER DEFAULT 0,
  total_atm_withdrawals DECIMAL(15,2) DEFAULT 0,
  total_atm_withdrawals_count INTEGER DEFAULT 0,
  
  -- Revenue Breakdown (Your Income)
  total_revenue DECIMAL(15,2) DEFAULT 0,
  activation_fee_revenue DECIMAL(15,2) DEFAULT 0,
  monthly_fee_revenue DECIMAL(15,2) DEFAULT 0,
  load_fee_revenue DECIMAL(15,2) DEFAULT 0,
  atm_fee_revenue DECIMAL(15,2) DEFAULT 0,
  transaction_fee_revenue DECIMAL(15,2) DEFAULT 0,
  other_fee_revenue DECIMAL(15,2) DEFAULT 0,
  
  -- Processor Share
  processor_share_amount DECIMAL(15,2) DEFAULT 0,
  net_revenue DECIMAL(15,2) DEFAULT 0, -- After processor share
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(summary_date, summary_type, program_id)
);

-- Card Partner Agreements (If you partner with employers/programs)
CREATE TABLE IF NOT EXISTS payroll_card_partner_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Partner Details
  partner_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50), -- employer, program_holder, workforce_board
  partner_id UUID, -- References employer, program_holder, etc.
  
  -- Program
  program_id UUID REFERENCES payroll_card_programs(id) NOT NULL,
  
  -- Agreement Terms
  agreement_start_date DATE NOT NULL,
  agreement_end_date DATE,
  minimum_cards INTEGER,
  
  -- Revenue Share with Partner (if applicable)
  partner_revenue_share_percentage DECIMAL(5,2) DEFAULT 0,
  partner_gets_activation_fee BOOLEAN DEFAULT false,
  partner_gets_monthly_fee BOOLEAN DEFAULT false,
  partner_gets_load_fee BOOLEAN DEFAULT false,
  
  -- Tracking
  total_cards_issued INTEGER DEFAULT 0,
  total_revenue_shared DECIMAL(15,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, expired, terminated
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_payroll_card_programs_code ON payroll_card_programs(program_code);
CREATE INDEX IF NOT EXISTS idx_payroll_cards_program ON payroll_cards(program_id);
CREATE INDEX IF NOT EXISTS idx_payroll_cards_employee ON payroll_cards(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_cards_profile ON payroll_cards(profile_id);
CREATE INDEX IF NOT EXISTS idx_payroll_cards_student ON payroll_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_payroll_cards_status ON payroll_cards(card_status);
CREATE INDEX IF NOT EXISTS idx_payroll_card_transactions_card ON payroll_card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_payroll_card_transactions_date ON payroll_card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_payroll_card_transactions_type ON payroll_card_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_payroll_card_load_requests_card ON payroll_card_load_requests(card_id);
CREATE INDEX IF NOT EXISTS idx_payroll_card_load_requests_status ON payroll_card_load_requests(status);
CREATE INDEX IF NOT EXISTS idx_payroll_card_disputes_card ON payroll_card_disputes(card_id);
CREATE INDEX IF NOT EXISTS idx_payroll_card_disputes_status ON payroll_card_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payroll_card_revenue_summary_date ON payroll_card_revenue_summary(summary_date);
CREATE INDEX IF NOT EXISTS idx_payroll_card_revenue_summary_program ON payroll_card_revenue_summary(program_id);

-- Enable Row Level Security
ALTER TABLE payroll_card_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_card_load_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_card_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_card_revenue_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_card_partner_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin and card holder access)
CREATE POLICY "Admins can manage all payroll cards"
  ON payroll_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'payroll_admin')
    )
  );

CREATE POLICY "Users can view their own payroll cards"
  ON payroll_cards FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR employee_id IN (
      SELECT id FROM employees WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all card transactions"
  ON payroll_card_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'payroll_admin')
    )
  );

CREATE POLICY "Users can view their own card transactions"
  ON payroll_card_transactions FOR SELECT
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM payroll_cards
      WHERE profile_id = auth.uid()
      OR employee_id IN (
        SELECT id FROM employees WHERE profile_id = auth.uid()
      )
    )
  );

-- Comments
COMMENT ON TABLE payroll_card_programs IS 'Card programs with fee structures - your revenue model';
COMMENT ON TABLE payroll_cards IS 'Tracks payroll cards issued - each card generates revenue';
COMMENT ON TABLE payroll_card_transactions IS 'All transactions with fee/revenue tracking';
COMMENT ON TABLE payroll_card_load_requests IS 'Load requests - each load can generate a fee';
COMMENT ON TABLE payroll_card_disputes IS 'Tracks disputes and issues with card transactions';
COMMENT ON TABLE payroll_card_revenue_summary IS 'Daily/monthly revenue aggregates for reporting';
COMMENT ON TABLE payroll_card_partner_agreements IS 'Partner agreements with revenue sharing terms';
