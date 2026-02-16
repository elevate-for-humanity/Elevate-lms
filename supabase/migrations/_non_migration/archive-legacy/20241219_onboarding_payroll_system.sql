-- =====================================================
-- DIGITAL ONBOARDING + PAYROLL + COMPLIANCE SYSTEM
-- =====================================================
-- Purpose: Complete end-to-end onboarding for Program Holders, 
-- Worksite Only, and Site Coordinators with digital signatures,
-- payroll setup, and audit trails.
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS onboarding_signatures CASCADE;
DROP TABLE IF EXISTS onboarding_documents CASCADE;
DROP TABLE IF EXISTS onboarding_packets CASCADE;
DROP TABLE IF EXISTS payroll_profiles CASCADE;
DROP TABLE IF EXISTS onboarding_progress CASCADE;
DROP TABLE IF EXISTS document_acknowledgments CASCADE;

-- =====================================================
-- 1. ONBOARDING PACKETS (ROLE-BASED TEMPLATES)
-- =====================================================
CREATE TABLE onboarding_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, version)
);

COMMENT ON TABLE onboarding_packets IS 'Role-specific onboarding packet templates with version control';

-- =====================================================
-- 2. ONBOARDING DOCUMENTS (WITHIN PACKETS)
-- =====================================================
CREATE TABLE onboarding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES onboarding_packets(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('MOU', 'HANDBOOK', 'W9', 'ACH', 'POLICY', 'ATTESTATION', 'LICENSE', 'INSURANCE', 'CONFIDENTIALITY', 'AVAILABILITY')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  requires_signature BOOLEAN DEFAULT true,
  requires_upload BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE onboarding_documents IS 'Individual documents within onboarding packets';

CREATE INDEX idx_onboarding_documents_packet ON onboarding_documents(packet_id);

-- =====================================================
-- 3. ONBOARDING SIGNATURES (AUDIT TRAIL)
-- =====================================================
CREATE TABLE onboarding_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES onboarding_documents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  signature_data TEXT NOT NULL, -- Base64 image or typed signature
  signature_type TEXT NOT NULL CHECK (signature_type IN ('TYPED', 'DRAWN')),
  document_version TEXT NOT NULL,
  document_hash TEXT NOT NULL, -- SHA256 hash of document content at time of signing
  signed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  is_valid BOOLEAN DEFAULT true,
  UNIQUE(user_id, document_id)
);

COMMENT ON TABLE onboarding_signatures IS 'Digital signatures with full audit trail (IP, timestamp, document version)';

CREATE INDEX idx_onboarding_signatures_user ON onboarding_signatures(user_id);
CREATE INDEX idx_onboarding_signatures_document ON onboarding_signatures(document_id);

-- =====================================================
-- 4. DOCUMENT ACKNOWLEDGMENTS (CHECKBOX CONFIRMATIONS)
-- =====================================================
CREATE TABLE document_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES onboarding_documents(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, document_id)
);

COMMENT ON TABLE document_acknowledgments IS 'Checkbox acknowledgments for documents that require reading but not signing';

CREATE INDEX idx_document_acknowledgments_user ON document_acknowledgments(user_id);

-- =====================================================
-- 5. PAYROLL PROFILES (PAYOUT CONFIGURATION)
-- =====================================================
CREATE TABLE payroll_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('PERCENTAGE', 'FLAT')),
  rate NUMERIC(10, 2) NOT NULL CHECK (rate > 0),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('STRIPE', 'ACH')),
  stripe_account_id TEXT,
  ach_routing_number TEXT,
  ach_account_number_last4 TEXT,
  tax_id_uploaded BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

COMMENT ON TABLE payroll_profiles IS 'Payroll configuration for each role with approval workflow';

CREATE INDEX idx_payroll_profiles_user ON payroll_profiles(user_id);
CREATE INDEX idx_payroll_profiles_status ON payroll_profiles(status);

-- =====================================================
-- 6. ONBOARDING PROGRESS (USER COMPLETION TRACKING)
-- =====================================================
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  packet_id UUID NOT NULL REFERENCES onboarding_packets(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_complete BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  UNIQUE(user_id, role)
);

COMMENT ON TABLE onboarding_progress IS 'Tracks user progress through onboarding checklist';

CREATE INDEX idx_onboarding_progress_user ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_progress_complete ON onboarding_progress(is_complete);

-- =====================================================
-- 7. PAYOUT RATE CONFIGURATIONS (REFERENCE TABLE)
-- =====================================================
CREATE TABLE payout_rate_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('PROGRAM_HOLDER', 'WORKSITE_ONLY', 'SITE_COORDINATOR')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('PERCENTAGE', 'FLAT')),
  min_rate NUMERIC(10, 2) NOT NULL,
  max_rate NUMERIC(10, 2) NOT NULL,
  default_rate NUMERIC(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, payment_type)
);

COMMENT ON TABLE payout_rate_configs IS 'Defines allowed payout ranges for each role';

-- Insert default payout configurations
INSERT INTO payout_rate_configs (role, payment_type, min_rate, max_rate, default_rate, description) VALUES
('PROGRAM_HOLDER', 'PERCENTAGE', 18.00, 22.00, 20.00, 'Percentage of tuition for full program management'),
('WORKSITE_ONLY', 'PERCENTAGE', 8.00, 12.00, 10.00, 'Percentage for hands-on supervision only'),
('SITE_COORDINATOR', 'FLAT', 400.00, 750.00, 500.00, 'Flat monthly rate for coordination duties');

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE onboarding_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_rate_configs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. RLS POLICIES - ONBOARDING PACKETS (PUBLIC READ)
-- =====================================================
CREATE POLICY "Anyone can view active onboarding packets"
  ON onboarding_packets FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 10. RLS POLICIES - ONBOARDING DOCUMENTS (PUBLIC READ)
-- =====================================================
CREATE POLICY "Anyone can view onboarding documents"
  ON onboarding_documents FOR SELECT
  USING (true);

-- =====================================================
-- 11. RLS POLICIES - ONBOARDING SIGNATURES (USER OWNED)
-- =====================================================
CREATE POLICY "Users can view their own signatures"
  ON onboarding_signatures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signatures"
  ON onboarding_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 12. RLS POLICIES - DOCUMENT ACKNOWLEDGMENTS (USER OWNED)
-- =====================================================
CREATE POLICY "Users can view their own acknowledgments"
  ON document_acknowledgments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own acknowledgments"
  ON document_acknowledgments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 13. RLS POLICIES - PAYROLL PROFILES (USER OWNED)
-- =====================================================
CREATE POLICY "Users can view their own payroll profile"
  ON payroll_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payroll profile"
  ON payroll_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending payroll profile"
  ON payroll_profiles FOR UPDATE
  USING (auth.uid() = user_id AND status = 'PENDING')
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 14. RLS POLICIES - ONBOARDING PROGRESS (USER OWNED)
-- =====================================================
CREATE POLICY "Users can view their own onboarding progress"
  ON onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 15. RLS POLICIES - PAYOUT RATE CONFIGS (PUBLIC READ)
-- =====================================================
CREATE POLICY "Anyone can view active payout rate configs"
  ON payout_rate_configs FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 16. FUNCTIONS - CHECK ONBOARDING COMPLETION
-- =====================================================
CREATE OR REPLACE FUNCTION check_onboarding_completion(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_packet_id UUID;
  v_required_docs INTEGER;
  v_signed_docs INTEGER;
  v_payroll_complete BOOLEAN;
BEGIN
  -- Get active packet for role
  SELECT id INTO v_packet_id
  FROM onboarding_packets
  WHERE role = p_role AND is_active = true
  LIMIT 1;

  IF v_packet_id IS NULL THEN
    RETURN false;
  END IF;

  -- Count required documents
  SELECT COUNT(*) INTO v_required_docs
  FROM onboarding_documents
  WHERE packet_id = v_packet_id AND requires_signature = true;

  -- Count signed documents
  SELECT COUNT(*) INTO v_signed_docs
  FROM onboarding_signatures
  WHERE user_id = p_user_id 
    AND document_id IN (
      SELECT id FROM onboarding_documents WHERE packet_id = v_packet_id AND requires_signature = true
    )
    AND is_valid = true;

  -- Check payroll profile exists and is not pending
  SELECT EXISTS(
    SELECT 1 FROM payroll_profiles
    WHERE user_id = p_user_id AND role = p_role AND status != 'PENDING'
  ) INTO v_payroll_complete;

  -- Complete if all docs signed and payroll set up
  RETURN (v_signed_docs >= v_required_docs AND v_payroll_complete);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_onboarding_completion IS 'Checks if user has completed all onboarding requirements for a role';

-- =====================================================
-- 17. FUNCTIONS - INITIATE ONBOARDING
-- =====================================================
CREATE OR REPLACE FUNCTION initiate_onboarding(p_user_id UUID, p_role TEXT)
RETURNS UUID AS $$
DECLARE
  v_packet_id UUID;
  v_progress_id UUID;
  v_total_steps INTEGER;
BEGIN
  -- Get active packet for role
  SELECT id INTO v_packet_id
  FROM onboarding_packets
  WHERE role = p_role AND is_active = true
  LIMIT 1;

  IF v_packet_id IS NULL THEN
    RAISE EXCEPTION 'No active onboarding packet found for role %', p_role;
  END IF;

  -- Count total steps (documents requiring signature)
  SELECT COUNT(*) INTO v_total_steps
  FROM onboarding_documents
  WHERE packet_id = v_packet_id AND requires_signature = true;

  -- Create or update progress record
  INSERT INTO onboarding_progress (user_id, role, packet_id, total_steps)
  VALUES (p_user_id, p_role, v_packet_id, v_total_steps)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    packet_id = v_packet_id,
    total_steps = v_total_steps,
    started_at = now()
  RETURNING id INTO v_progress_id;

  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION initiate_onboarding IS 'Starts onboarding process for a user in a specific role';

-- =====================================================
-- 18. FUNCTIONS - COMPLETE ONBOARDING STEP
-- =====================================================
CREATE OR REPLACE FUNCTION complete_onboarding_step(p_user_id UUID, p_role TEXT)
RETURNS VOID AS $$
DECLARE
  v_is_complete BOOLEAN;
BEGIN
  -- Check if onboarding is complete
  v_is_complete := check_onboarding_completion(p_user_id, p_role);

  -- Update progress
  UPDATE onboarding_progress
  SET 
    is_complete = v_is_complete,
    completed_at = CASE WHEN v_is_complete THEN now() ELSE NULL END,
    current_step = current_step + 1
  WHERE user_id = p_user_id AND role = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION complete_onboarding_step IS 'Advances onboarding progress and checks for completion';

-- =====================================================
-- 19. FUNCTIONS - VALIDATE PAYOUT RATE
-- =====================================================
CREATE OR REPLACE FUNCTION validate_payout_rate(p_role TEXT, p_payment_type TEXT, p_rate NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
  v_min_rate NUMERIC;
  v_max_rate NUMERIC;
BEGIN
  SELECT min_rate, max_rate INTO v_min_rate, v_max_rate
  FROM payout_rate_configs
  WHERE role = p_role AND payment_type = p_payment_type AND is_active = true;

  IF v_min_rate IS NULL THEN
    RETURN false;
  END IF;

  RETURN (p_rate >= v_min_rate AND p_rate <= v_max_rate);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_payout_rate IS 'Validates that payout rate is within allowed range for role';

-- =====================================================
-- 20. TRIGGERS - UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_packets_updated_at BEFORE UPDATE ON onboarding_packets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_documents_updated_at BEFORE UPDATE ON onboarding_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_profiles_updated_at BEFORE UPDATE ON payroll_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 21. VIEWS - ONBOARDING COMPLETION STATUS
-- =====================================================
CREATE OR REPLACE VIEW onboarding_completion_status AS
SELECT 
  op.user_id,
  op.role,
  op.is_complete,
  op.current_step,
  op.total_steps,
  op.started_at,
  op.completed_at,
  COUNT(DISTINCT os.id) as signed_documents,
  COUNT(DISTINCT CASE WHEN od.requires_signature THEN od.id END) as required_documents,
  pp.status as payroll_status,
  pp.payout_method
FROM onboarding_progress op
LEFT JOIN onboarding_packets pk ON op.packet_id = pk.id
LEFT JOIN onboarding_documents od ON pk.id = od.packet_id
LEFT JOIN onboarding_signatures os ON od.id = os.document_id AND os.user_id = op.user_id
LEFT JOIN payroll_profiles pp ON op.user_id = pp.user_id AND op.role = pp.role
GROUP BY op.user_id, op.role, op.is_complete, op.current_step, op.total_steps, 
         op.started_at, op.completed_at, pp.status, pp.payout_method;

COMMENT ON VIEW onboarding_completion_status IS 'Complete view of user onboarding status with document and payroll progress';

-- =====================================================
-- 22. VIEWS - PENDING PAYROLL APPROVALS
-- =====================================================
CREATE OR REPLACE VIEW pending_payroll_approvals AS
SELECT 
  pp.id,
  pp.user_id,
  p.full_name,
  p.email,
  pp.role,
  pp.payment_type,
  pp.rate,
  pp.payout_method,
  pp.tax_id_uploaded,
  pp.created_at,
  prc.min_rate,
  prc.max_rate,
  prc.default_rate,
  CASE 
    WHEN pp.rate < prc.min_rate OR pp.rate > prc.max_rate THEN 'OUT_OF_RANGE'
    WHEN NOT pp.tax_id_uploaded THEN 'MISSING_TAX_ID'
    ELSE 'READY'
  END as approval_status
FROM payroll_profiles pp
JOIN profiles p ON pp.user_id = p.id
JOIN payout_rate_configs prc ON pp.role = prc.role AND pp.payment_type = prc.payment_type
WHERE pp.status = 'PENDING';

COMMENT ON VIEW pending_payroll_approvals IS 'Admin view of payroll profiles awaiting approval with validation status';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates a complete digital onboarding system with:
-- ✅ Role-based onboarding packets
-- ✅ Digital signature capture with audit trails
-- ✅ Payroll profile setup with approval workflow
-- ✅ Progress tracking
-- ✅ Validation functions
-- ✅ Admin approval views
-- ✅ Full RLS security
-- =====================================================
