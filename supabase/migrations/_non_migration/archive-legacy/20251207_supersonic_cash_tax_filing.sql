-- Supersonic Cash Advance Applications
CREATE TABLE IF NOT EXISTS cash_advance_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  ssn_last4 TEXT,
  
  -- Address
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  
  -- Employment/Income
  employment_status TEXT NOT NULL CHECK (employment_status IN ('student', 'employed', 'both')),
  employer TEXT,
  monthly_income DECIMAL(10,2),
  training_stipend DECIMAL(10,2),
  total_income DECIMAL(10,2) NOT NULL,
  
  -- Banking
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  routing_number TEXT NOT NULL,
  account_number TEXT NOT NULL,
  
  -- Loan Details
  requested_amount DECIMAL(10,2) NOT NULL,
  approved_amount DECIMAL(10,2),
  fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_repayment DECIMAL(10,2) NOT NULL,
  purpose TEXT,
  repayment_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'funded', 'repaid', 'defaulted')),
  application_date TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  funded_at TIMESTAMPTZ,
  repaid_at TIMESTAMPTZ,
  
  -- EOS Financial Integration
  eos_application_id TEXT,
  eos_status TEXT,
  eos_response JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Filing Applications
CREATE TABLE IF NOT EXISTS tax_filing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  ssn TEXT,
  date_of_birth DATE,
  
  -- Address
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  
  -- Filing Info
  filing_status TEXT NOT NULL CHECK (filing_status IN ('single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow')),
  dependents INTEGER DEFAULT 0,
  tax_year INTEGER NOT NULL,
  
  -- Income Sources
  w2_income DECIMAL(10,2),
  self_employment_income DECIMAL(10,2),
  investment_income DECIMAL(10,2),
  other_income DECIMAL(10,2),
  
  -- Deductions
  standard_deduction BOOLEAN DEFAULT true,
  itemized_deductions DECIMAL(10,2),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'ready_to_file', 'filed', 'accepted', 'rejected')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_amount DECIMAL(10,2) DEFAULT 100.00,
  
  -- Drake Software Integration
  drake_return_id TEXT,
  drake_status TEXT,
  drake_data JSONB,
  
  -- IRS Filing
  irs_confirmation TEXT,
  irs_status TEXT,
  filed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Refund Info
  estimated_refund DECIMAL(10,2),
  actual_refund DECIMAL(10,2),
  refund_method TEXT CHECK (refund_method IN ('direct_deposit', 'check')),
  
  -- Assigned Preparer
  preparer_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Preparer Profiles
CREATE TABLE IF NOT EXISTS tax_preparers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  
  -- Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  
  -- Location
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  
  -- Certification
  ptin TEXT UNIQUE, -- IRS Preparer Tax Identification Number
  certification_date DATE,
  certification_expiry DATE,
  drake_certified BOOLEAN DEFAULT false,
  
  -- Business Model
  business_model TEXT NOT NULL CHECK (business_model IN ('work_from_home', 'mobile', 'storefront')),
  office_address TEXT,
  service_area TEXT[], -- Array of ZIP codes or cities
  
  -- Stats
  returns_filed INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'active', 'inactive', 'suspended')),
  training_completed BOOLEAN DEFAULT false,
  training_completion_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Preparer Training Enrollments
CREATE TABLE IF NOT EXISTS tax_preparer_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Location
  state TEXT NOT NULL,
  city TEXT,
  
  -- Training Details
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  training_status TEXT NOT NULL DEFAULT 'enrolled' CHECK (training_status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  completion_date DATE,
  
  -- Payment
  training_fee DECIMAL(10,2) DEFAULT 499.00,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  refund_eligible BOOLEAN DEFAULT true,
  returns_filed_count INTEGER DEFAULT 0,
  refund_issued BOOLEAN DEFAULT false,
  
  -- Exam
  exam_attempts INTEGER DEFAULT 0,
  exam_passed BOOLEAN DEFAULT false,
  exam_score DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Preparer Reviews
CREATE TABLE IF NOT EXISTS tax_preparer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparer_id UUID REFERENCES tax_preparers(id) ON DELETE CASCADE,
  
  -- Review Info
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- Location
  city TEXT,
  state TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  tax_return_id UUID REFERENCES tax_filing_applications(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cash_advance_status ON cash_advance_applications(status);
CREATE INDEX IF NOT EXISTS idx_cash_advance_email ON cash_advance_applications(email);
CREATE INDEX IF NOT EXISTS idx_cash_advance_repayment_date ON cash_advance_applications(repayment_date);

CREATE INDEX IF NOT EXISTS idx_tax_filing_status ON tax_filing_applications(status);
CREATE INDEX IF NOT EXISTS idx_tax_filing_email ON tax_filing_applications(email);
CREATE INDEX IF NOT EXISTS idx_tax_filing_preparer ON tax_filing_applications(preparer_id);
CREATE INDEX IF NOT EXISTS idx_tax_filing_state ON tax_filing_applications(state);

CREATE INDEX IF NOT EXISTS idx_tax_preparers_state ON tax_preparers(state);
CREATE INDEX IF NOT EXISTS idx_tax_preparers_status ON tax_preparers(status);
CREATE INDEX IF NOT EXISTS idx_tax_preparers_ptin ON tax_preparers(ptin);

CREATE INDEX IF NOT EXISTS idx_tax_training_status ON tax_preparer_training(training_status);
CREATE INDEX IF NOT EXISTS idx_tax_training_state ON tax_preparer_training(state);

CREATE INDEX IF NOT EXISTS idx_tax_reviews_preparer ON tax_preparer_reviews(preparer_id);
CREATE INDEX IF NOT EXISTS idx_tax_reviews_rating ON tax_preparer_reviews(rating);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cash_advance_updated_at
  BEFORE UPDATE ON cash_advance_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tax_filing_updated_at
  BEFORE UPDATE ON tax_filing_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tax_preparers_updated_at
  BEFORE UPDATE ON tax_preparers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tax_training_updated_at
  BEFORE UPDATE ON tax_preparer_training
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE cash_advance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_filing_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_preparers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_preparer_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_preparer_reviews ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY "Admins can manage cash advances" ON cash_advance_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage tax filings" ON tax_filing_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Public can view preparer profiles and reviews
CREATE POLICY "Public can view active preparers" ON tax_preparers
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view reviews" ON tax_preparer_reviews
  FOR SELECT USING (true);

-- Comments
COMMENT ON TABLE cash_advance_applications IS 'Supersonic Cash Advance applications with EOS Financial integration';
COMMENT ON TABLE tax_filing_applications IS 'Tax filing applications with Drake Software integration';
COMMENT ON TABLE tax_preparers IS 'Certified tax preparers in our network';
COMMENT ON TABLE tax_preparer_training IS 'Tax preparation training enrollments';
COMMENT ON TABLE tax_preparer_reviews IS 'Customer reviews for tax preparers';
