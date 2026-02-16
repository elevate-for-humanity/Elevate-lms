-- =====================================================
-- FUNDING PATHWAY ENFORCEMENT SYSTEM
-- Enforces three funding pathways with intake requirements
-- =====================================================

-- Funding pathway enum
DO $$ BEGIN
  CREATE TYPE funding_pathway AS ENUM (
    'workforce_funded',
    'employer_sponsored', 
    'structured_tuition'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Intake status enum
DO $$ BEGIN
  CREATE TYPE intake_status AS ENUM (
    'not_started',
    'identity_pending',
    'workforce_screening',
    'employer_screening',
    'financial_readiness',
    'program_readiness',
    'pending_signature',
    'completed',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment plan status enum
DO $$ BEGIN
  CREATE TYPE payment_plan_status AS ENUM (
    'active',
    'paused',
    'completed',
    'defaulted',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- INTAKE RECORDS TABLE
-- Required before any enrollment can proceed
-- =====================================================

CREATE TABLE IF NOT EXISTS intake_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  
  -- Intake status tracking
  status intake_status NOT NULL DEFAULT 'not_started',
  
  -- Step 1: Identity verification
  identity_verified BOOLEAN DEFAULT FALSE,
  identity_verified_at TIMESTAMPTZ,
  identity_document_type TEXT,
  
  -- Step 2: Workforce eligibility screening
  workforce_screening_completed BOOLEAN DEFAULT FALSE,
  workforce_screening_at TIMESTAMPTZ,
  workforce_eligible BOOLEAN,
  workforce_agency TEXT,
  workforce_case_manager TEXT,
  workforce_funding_type TEXT,
  
  -- Step 3: Employer sponsorship screening
  employer_screening_completed BOOLEAN DEFAULT FALSE,
  employer_screening_at TIMESTAMPTZ,
  employer_eligible BOOLEAN,
  employer_name TEXT,
  employer_contact TEXT,
  employer_reimbursement_confirmed BOOLEAN DEFAULT FALSE,
  
  -- Step 4: Financial readiness (for structured tuition only)
  financial_readiness_completed BOOLEAN DEFAULT FALSE,
  financial_readiness_at TIMESTAMPTZ,
  can_pay_down_payment BOOLEAN,
  can_commit_monthly BOOLEAN,
  accepts_auto_payment BOOLEAN,
  understands_90_day_limit BOOLEAN,
  
  -- Step 5: Program readiness
  program_readiness_completed BOOLEAN DEFAULT FALSE,
  program_readiness_at TIMESTAMPTZ,
  start_date_confirmed BOOLEAN,
  attendance_requirements_understood BOOLEAN,
  technology_access_confirmed BOOLEAN,
  time_commitment_acknowledged BOOLEAN,
  outcome_expectations_explained BOOLEAN,
  
  -- Funding pathway assignment (exactly one)
  funding_pathway funding_pathway,
  funding_pathway_assigned_at TIMESTAMPTZ,
  funding_pathway_assigned_by UUID REFERENCES auth.users(id),
  
  -- Digital signature
  acknowledgment_signed BOOLEAN DEFAULT FALSE,
  acknowledgment_signed_at TIMESTAMPTZ,
  acknowledgment_signature_data TEXT,
  acknowledgment_ip_address TEXT,
  
  -- Staff tracking
  intake_staff_id UUID REFERENCES auth.users(id),
  intake_started_at TIMESTAMPTZ DEFAULT NOW(),
  intake_completed_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, program_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intake_records_user ON intake_records(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_records_status ON intake_records(status);
CREATE INDEX IF NOT EXISTS idx_intake_records_pathway ON intake_records(funding_pathway);
CREATE INDEX IF NOT EXISTS idx_intake_records_program ON intake_records(program_id);

-- =====================================================
-- ADD FUNDING PATHWAY TO ENROLLMENTS
-- =====================================================

ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS funding_pathway funding_pathway;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS intake_record_id UUID REFERENCES intake_records(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN DEFAULT FALSE;

-- Constraint: enrollment requires completed intake
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollment_requires_intake;
ALTER TABLE enrollments ADD CONSTRAINT enrollment_requires_intake 
  CHECK (intake_completed = TRUE OR status = 'pending');

-- Constraint: enrollment requires funding pathway
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollment_requires_pathway;
ALTER TABLE enrollments ADD CONSTRAINT enrollment_requires_pathway
  CHECK (funding_pathway IS NOT NULL OR status = 'pending');

-- =====================================================
-- STRUCTURED TUITION PAYMENT PLANS (BRIDGE ONLY)
-- Maximum 90 days, $500 down, $200/month
-- =====================================================

CREATE TABLE IF NOT EXISTS bridge_payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan structure (enforced)
  down_payment_amount NUMERIC NOT NULL DEFAULT 500 CHECK (down_payment_amount >= 500),
  monthly_payment_amount NUMERIC NOT NULL DEFAULT 200 CHECK (monthly_payment_amount >= 200),
  max_term_months INTEGER NOT NULL DEFAULT 3 CHECK (max_term_months <= 3),
  
  -- Payment tracking
  down_payment_paid BOOLEAN DEFAULT FALSE,
  down_payment_paid_at TIMESTAMPTZ,
  down_payment_stripe_id TEXT,
  
  -- Monthly payments
  months_paid INTEGER DEFAULT 0,
  last_payment_at TIMESTAMPTZ,
  next_payment_due DATE,
  
  -- Auto-payment requirement
  auto_payment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_subscription_id TEXT,
  
  -- Status
  status payment_plan_status NOT NULL DEFAULT 'active',
  
  -- Plan dates
  plan_start_date DATE NOT NULL,
  plan_end_date DATE NOT NULL,
  
  -- Balance tracking
  total_amount NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  balance_remaining NUMERIC GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  
  -- Academic access control
  academic_access_paused BOOLEAN DEFAULT FALSE,
  academic_access_paused_at TIMESTAMPTZ,
  academic_access_paused_reason TEXT,
  
  -- Credential hold
  credential_hold BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Enforce 90-day maximum
  CONSTRAINT bridge_plan_90_day_max CHECK (plan_end_date <= plan_start_date + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_bridge_plans_enrollment ON bridge_payment_plans(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_bridge_plans_user ON bridge_payment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_plans_status ON bridge_payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_bridge_plans_next_due ON bridge_payment_plans(next_payment_due);

-- =====================================================
-- EMPLOYER SPONSORSHIP TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS employer_sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Employer info
  employer_name TEXT NOT NULL,
  employer_contact_name TEXT,
  employer_contact_email TEXT,
  employer_contact_phone TEXT,
  
  -- Sponsorship terms
  total_tuition NUMERIC NOT NULL DEFAULT 5000,
  monthly_reimbursement NUMERIC NOT NULL CHECK (monthly_reimbursement BETWEEN 250 AND 400),
  term_months INTEGER NOT NULL CHECK (term_months BETWEEN 12 AND 20),
  
  -- Hire tracking
  hire_date DATE,
  hire_confirmed BOOLEAN DEFAULT FALSE,
  hire_confirmed_at TIMESTAMPTZ,
  
  -- Reimbursement tracking
  reimbursements_received INTEGER DEFAULT 0,
  total_reimbursed NUMERIC DEFAULT 0,
  last_reimbursement_at TIMESTAMPTZ,
  next_reimbursement_due DATE,
  
  -- Separation handling
  employment_ended BOOLEAN DEFAULT FALSE,
  employment_ended_at TIMESTAMPTZ,
  employment_end_reason TEXT,
  reimbursement_stopped_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'agreement_sent',
    'agreement_signed',
    'awaiting_hire',
    'active',
    'completed',
    'separated',
    'cancelled'
  )),
  
  -- Agreement
  agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_signed_at TIMESTAMPTZ,
  agreement_document_url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_sponsorships_enrollment ON employer_sponsorships(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_employer_sponsorships_employer ON employer_sponsorships(employer_name);
CREATE INDEX IF NOT EXISTS idx_employer_sponsorships_status ON employer_sponsorships(status);

-- =====================================================
-- WORKFORCE REFERRALS
-- =====================================================

CREATE TABLE IF NOT EXISTS workforce_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Referral source
  agency_name TEXT NOT NULL,
  agency_type TEXT CHECK (agency_type IN (
    'american_job_center',
    'workforce_board',
    'vocational_rehabilitation',
    'wioa',
    'jri',
    'snap_et',
    'fssa',
    'other'
  )),
  case_manager_name TEXT,
  case_manager_email TEXT,
  case_manager_phone TEXT,
  
  -- Funding details
  funding_type TEXT,
  voucher_number TEXT,
  funding_amount NUMERIC,
  funding_approved BOOLEAN DEFAULT FALSE,
  funding_approved_at TIMESTAMPTZ,
  
  -- Status tracking for agency reporting
  status TEXT NOT NULL DEFAULT 'referred' CHECK (status IN (
    'referred',
    'intake_started',
    'enrolled',
    'active',
    'completed',
    'withdrawn',
    'cancelled'
  )),
  
  -- Automated status updates
  last_status_update_sent_at TIMESTAMPTZ,
  status_update_email_enabled BOOLEAN DEFAULT TRUE,
  
  -- Audit
  referral_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_agency ON workforce_referrals(agency_name);
CREATE INDEX IF NOT EXISTS idx_workforce_referrals_status ON workforce_referrals(status);
CREATE INDEX IF NOT EXISTS idx_workforce_referrals_user ON workforce_referrals(user_id);

-- =====================================================
-- COMPLIANCE AUDIT RECORDS
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Audit period
  audit_month INTEGER NOT NULL CHECK (audit_month BETWEEN 1 AND 12),
  audit_year INTEGER NOT NULL,
  
  -- Section 1: Enrollment integrity
  total_enrollments INTEGER DEFAULT 0,
  completed_intakes INTEGER DEFAULT 0,
  enrollments_without_intake INTEGER DEFAULT 0,
  provisional_enrollments INTEGER DEFAULT 0,
  
  -- Section 2: Funding pathway distribution
  workforce_funded_count INTEGER DEFAULT 0,
  employer_sponsored_count INTEGER DEFAULT 0,
  structured_tuition_count INTEGER DEFAULT 0,
  lane3_percentage NUMERIC,
  lane3_threshold_exceeded BOOLEAN DEFAULT FALSE,
  
  -- Section 3: Payment compliance
  accounts_current INTEGER DEFAULT 0,
  accounts_missed_payment INTEGER DEFAULT 0,
  accounts_paused INTEGER DEFAULT 0,
  accounts_beyond_90_days INTEGER DEFAULT 0,
  
  -- Section 4: Exceptions
  executive_exceptions INTEGER DEFAULT 0,
  staff_exceptions INTEGER DEFAULT 0,
  
  -- Section 5: Script adherence (manual entry)
  script_samples_reviewed INTEGER DEFAULT 0,
  script_deviations_found INTEGER DEFAULT 0,
  
  -- Section 6: Intake accuracy (manual entry)
  intake_files_reviewed INTEGER DEFAULT 0,
  intake_issues_found INTEGER DEFAULT 0,
  
  -- Auto-flagged issues
  auto_flagged_issues JSONB DEFAULT '[]',
  
  -- Sign-offs
  admissions_lead_signed BOOLEAN DEFAULT FALSE,
  admissions_lead_signed_at TIMESTAMPTZ,
  admissions_lead_id UUID REFERENCES auth.users(id),
  
  program_director_signed BOOLEAN DEFAULT FALSE,
  program_director_signed_at TIMESTAMPTZ,
  program_director_id UUID REFERENCES auth.users(id),
  
  executive_signed BOOLEAN DEFAULT FALSE,
  executive_signed_at TIMESTAMPTZ,
  executive_id UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'in_progress',
    'pending_signoff',
    'completed'
  )),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(audit_month, audit_year)
);

CREATE INDEX IF NOT EXISTS idx_compliance_audits_period ON compliance_audits(audit_year, audit_month);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_status ON compliance_audits(status);

-- =====================================================
-- ADMISSIONS SCRIPT ACKNOWLEDGMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS script_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intake_record_id UUID REFERENCES intake_records(id) ON DELETE SET NULL,
  
  -- Acknowledgment
  script_followed BOOLEAN NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Deviation tracking (admin only)
  deviation_noted BOOLEAN DEFAULT FALSE,
  deviation_description TEXT,
  deviation_reviewed_by UUID REFERENCES auth.users(id),
  deviation_reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_script_acks_staff ON script_acknowledgments(staff_id);
CREATE INDEX IF NOT EXISTS idx_script_acks_intake ON script_acknowledgments(intake_record_id);

-- =====================================================
-- CREDENTIAL ISSUANCE CONTROLS
-- =====================================================

-- Add balance check to certificates table
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS balance_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS balance_verified_at TIMESTAMPTZ;

-- Function to check balance before credential issuance
CREATE OR REPLACE FUNCTION check_balance_before_credential()
RETURNS TRIGGER AS $$
DECLARE
  has_balance BOOLEAN;
BEGIN
  -- Check if enrollment has outstanding balance
  SELECT EXISTS (
    SELECT 1 FROM bridge_payment_plans 
    WHERE enrollment_id = NEW.enrollment_id 
    AND balance_remaining > 0
  ) INTO has_balance;
  
  IF has_balance THEN
    RAISE EXCEPTION 'Cannot issue credential: outstanding balance exists';
  END IF;
  
  NEW.balance_verified := TRUE;
  NEW.balance_verified_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_balance_before_credential_trigger ON certificates;
CREATE TRIGGER check_balance_before_credential_trigger
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION check_balance_before_credential();

-- =====================================================
-- FUNCTION: Pause academic access on missed payment
-- =====================================================

CREATE OR REPLACE FUNCTION pause_access_on_missed_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment is overdue by more than 3 days
  IF NEW.next_payment_due < CURRENT_DATE - INTERVAL '3 days' 
     AND NEW.status = 'active' 
     AND NEW.academic_access_paused = FALSE THEN
    
    NEW.academic_access_paused := TRUE;
    NEW.academic_access_paused_at := NOW();
    NEW.academic_access_paused_reason := 'Missed payment - auto-paused';
    
    -- Update enrollment status
    UPDATE enrollments 
    SET status = 'paused',
        updated_at = NOW()
    WHERE id = NEW.enrollment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pause_access_on_missed_payment_trigger ON bridge_payment_plans;
CREATE TRIGGER pause_access_on_missed_payment_trigger
  BEFORE UPDATE ON bridge_payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION pause_access_on_missed_payment();

-- =====================================================
-- FUNCTION: Validate intake before enrollment
-- =====================================================

CREATE OR REPLACE FUNCTION validate_intake_before_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  intake_complete BOOLEAN;
BEGIN
  -- Skip validation for pending enrollments
  IF NEW.status = 'pending' THEN
    RETURN NEW;
  END IF;
  
  -- Check if intake is completed
  SELECT (status = 'completed' AND acknowledgment_signed = TRUE)
  INTO intake_complete
  FROM intake_records
  WHERE id = NEW.intake_record_id;
  
  IF intake_complete IS NULL OR intake_complete = FALSE THEN
    RAISE EXCEPTION 'Cannot activate enrollment: intake not completed';
  END IF;
  
  -- Verify funding pathway is assigned
  IF NEW.funding_pathway IS NULL THEN
    RAISE EXCEPTION 'Cannot activate enrollment: funding pathway not assigned';
  END IF;
  
  NEW.intake_completed := TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_intake_before_enrollment_trigger ON enrollments;
CREATE TRIGGER validate_intake_before_enrollment_trigger
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status != 'pending')
  EXECUTE FUNCTION validate_intake_before_enrollment();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE intake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Intake records: users see own, staff see all
CREATE POLICY "Users can view own intake" ON intake_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage intakes" ON intake_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'advisor', 'super_admin'))
  );

-- Bridge payment plans: users see own, admins manage
CREATE POLICY "Users can view own payment plan" ON bridge_payment_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage payment plans" ON bridge_payment_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Employer sponsorships: admins only
CREATE POLICY "Admins can manage sponsorships" ON employer_sponsorships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Workforce referrals: staff can manage
CREATE POLICY "Staff can manage referrals" ON workforce_referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'advisor', 'super_admin'))
  );

-- Compliance audits: leadership only
CREATE POLICY "Leadership can manage audits" ON compliance_audits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Script acknowledgments: staff can insert, admins can view all
CREATE POLICY "Staff can insert acknowledgments" ON script_acknowledgments
  FOR INSERT WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Admins can view acknowledgments" ON script_acknowledgments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON intake_records TO authenticated;
GRANT SELECT ON bridge_payment_plans TO authenticated;
GRANT SELECT ON employer_sponsorships TO authenticated;
GRANT SELECT ON workforce_referrals TO authenticated;
GRANT SELECT ON compliance_audits TO authenticated;
GRANT SELECT, INSERT ON script_acknowledgments TO authenticated;

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_intake_records_updated_at
  BEFORE UPDATE ON intake_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bridge_payment_plans_updated_at
  BEFORE UPDATE ON bridge_payment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employer_sponsorships_updated_at
  BEFORE UPDATE ON employer_sponsorships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workforce_referrals_updated_at
  BEFORE UPDATE ON workforce_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_audits_updated_at
  BEFORE UPDATE ON compliance_audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE intake_records IS 'Required intake workflow before enrollment - enforces funding pathway assignment';
COMMENT ON TABLE bridge_payment_plans IS 'Structured tuition bridge plans - 90 day max, $500 down, $200/month';
COMMENT ON TABLE employer_sponsorships IS 'Employer sponsorship tracking with post-hire reimbursement';
COMMENT ON TABLE workforce_referrals IS 'Workforce agency referral tracking with automated status updates';
COMMENT ON TABLE compliance_audits IS 'Monthly compliance audit records with leadership sign-off';
COMMENT ON TABLE script_acknowledgments IS 'Staff acknowledgment of admissions script usage';

SELECT 'Funding pathway enforcement system installed' AS result;
