-- Enterprise Compliance Enforcement Migration
-- Applies full agreement tracking, immutability, and audit trail for WIOA/apprenticeship compliance

-- ============================================================================
-- PART 1: Agreement Types and Core Tables
-- ============================================================================

-- Agreement types enum (if not exists)
DO $$ BEGIN
  CREATE TYPE agreement_type AS ENUM (
    'eula',           -- End User License Agreement
    'tos',            -- Terms of Service
    'aup',            -- Acceptable Use Policy
    'disclosures',    -- Disclosures and Disclaimers
    'license',        -- License Agreement (for licensees)
    'nda',            -- Non-Disclosure Agreement
    'mou',            -- Memorandum of Understanding (agencies)
    'enrollment',     -- Student Enrollment Agreement
    'participation',  -- Program Participation Agreement
    'ferpa',          -- FERPA Consent
    'media_release',  -- Media Release Consent
    'handbook',       -- Student Handbook Acknowledgment
    'employer',       -- Employer Partnership Agreement
    'partner'         -- Partner/Agency Agreement
  );
EXCEPTION
  WHEN duplicate_object THEN 
    -- Add new values to existing enum
    ALTER TYPE agreement_type ADD VALUE IF NOT EXISTS 'enrollment';
    ALTER TYPE agreement_type ADD VALUE IF NOT EXISTS 'participation';
    ALTER TYPE agreement_type ADD VALUE IF NOT EXISTS 'ferpa';
    ALTER TYPE agreement_type ADD VALUE IF NOT EXISTS 'media_release';
    ALTER TYPE agreement_type ADD VALUE IF NOT EXISTS 'handbook';
    ALTER TYPE agreement_type ADD VALUE IF NOT EXISTS 'employer';
    ALTER TYPE agreement_type ADD VALUE IF NOT EXISTS 'partner';
END $$;

-- Signature method enum
DO $$ BEGIN
  CREATE TYPE signature_method AS ENUM ('checkbox', 'typed', 'drawn');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Onboarding status enum
DO $$ BEGIN
  CREATE TYPE onboarding_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 2: License Agreement Acceptances (Immutable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS license_agreement_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT, -- RESTRICT prevents deletion of users with agreements
  organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT,
  
  -- Agreement details
  agreement_type agreement_type NOT NULL,
  document_version TEXT NOT NULL,
  document_hash TEXT, -- SHA-256 hash of document content at signing time
  document_url TEXT,
  
  -- Digital signature fields (legally binding)
  signer_name TEXT NOT NULL,
  signer_title TEXT,
  signer_email TEXT NOT NULL,
  auth_email TEXT NOT NULL, -- Email from auth.users at signing time (validated)
  signature_data TEXT, -- Base64 encoded drawn signature
  signature_typed TEXT, -- Typed signature
  signature_method signature_method NOT NULL DEFAULT 'checkbox',
  
  -- Acceptance metadata (immutable audit trail)
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  
  -- Context
  acceptance_context TEXT, -- 'enrollment', 'onboarding', 'checkout', 'renewal'
  program_id UUID REFERENCES programs(id),
  stripe_session_id TEXT,
  
  -- Legal acknowledgment
  legal_acknowledgment BOOLEAN NOT NULL DEFAULT TRUE,
  intent_statement TEXT NOT NULL DEFAULT 'I acknowledge that I have read, understand, and agree to be bound by the terms of this agreement. I understand this constitutes a legally binding electronic signature.',
  
  -- Role at time of signing (for audit)
  role_at_signing TEXT,
  
  -- Immutability marker
  is_immutable BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Unique constraint: one acceptance per user per agreement type per version
  UNIQUE(user_id, agreement_type, document_version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_laa_user ON license_agreement_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_laa_org ON license_agreement_acceptances(organization_id);
CREATE INDEX IF NOT EXISTS idx_laa_tenant ON license_agreement_acceptances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_laa_type ON license_agreement_acceptances(agreement_type);
CREATE INDEX IF NOT EXISTS idx_laa_accepted_at ON license_agreement_acceptances(accepted_at);

-- ============================================================================
-- PART 3: Agreement Versions (Document Version Control)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_type agreement_type NOT NULL,
  version TEXT NOT NULL,
  document_hash TEXT NOT NULL, -- SHA-256 hash of document content
  document_url TEXT NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE, -- NULL means currently active
  summary_of_changes TEXT,
  requires_re_acceptance BOOLEAN DEFAULT FALSE, -- If true, users must re-sign
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(agreement_type, version)
);

CREATE INDEX IF NOT EXISTS idx_av_type ON agreement_versions(agreement_type);
CREATE INDEX IF NOT EXISTS idx_av_effective ON agreement_versions(effective_date);

-- Seed initial agreement versions
INSERT INTO agreement_versions (agreement_type, version, document_hash, document_url, effective_date) VALUES
  ('eula', '1.0', 'pending_hash', '/legal/eula', '2026-01-01'),
  ('tos', '1.0', 'pending_hash', '/legal/terms-of-service', '2026-01-01'),
  ('aup', '1.0', 'pending_hash', '/legal/acceptable-use', '2026-01-01'),
  ('disclosures', '1.0', 'pending_hash', '/legal/disclosures', '2026-01-01'),
  ('enrollment', '1.0', 'pending_hash', '/legal/enrollment-agreement', '2026-01-01'),
  ('participation', '1.0', 'pending_hash', '/legal/participation-agreement', '2026-01-01'),
  ('ferpa', '1.0', 'pending_hash', '/legal/ferpa-consent', '2026-01-01'),
  ('media_release', '1.0', 'pending_hash', '/legal/media-release', '2026-01-01'),
  ('handbook', '1.0', 'pending_hash', '/legal/student-handbook', '2026-01-01')
ON CONFLICT (agreement_type, version) DO NOTHING;

-- ============================================================================
-- PART 4: Onboarding Progress Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  
  -- Step completion tracking
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_completed_at TIMESTAMPTZ,
  
  agreements_completed BOOLEAN DEFAULT FALSE,
  agreements_completed_at TIMESTAMPTZ,
  
  handbook_acknowledged BOOLEAN DEFAULT FALSE,
  handbook_acknowledged_at TIMESTAMPTZ,
  
  documents_uploaded BOOLEAN DEFAULT FALSE,
  documents_uploaded_at TIMESTAMPTZ,
  
  -- Overall status
  status onboarding_status DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_op_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_op_status ON onboarding_progress(status);

-- ============================================================================
-- PART 5: Handbook Acknowledgments (Separate for Compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS handbook_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  tenant_id UUID REFERENCES tenants(id),
  
  -- Handbook details
  handbook_version TEXT NOT NULL,
  handbook_hash TEXT, -- SHA-256 of handbook content
  
  -- Acknowledgment details
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  
  -- Specific acknowledgments (checkboxes)
  attendance_policy_ack BOOLEAN DEFAULT FALSE,
  dress_code_ack BOOLEAN DEFAULT FALSE,
  conduct_policy_ack BOOLEAN DEFAULT FALSE,
  safety_policy_ack BOOLEAN DEFAULT FALSE,
  grievance_policy_ack BOOLEAN DEFAULT FALSE,
  
  -- Full acknowledgment statement
  full_acknowledgment BOOLEAN NOT NULL DEFAULT TRUE,
  acknowledgment_statement TEXT NOT NULL DEFAULT 'I have read and understand the Student Handbook. I agree to abide by all policies and procedures outlined therein.',
  
  -- Immutable
  is_immutable BOOLEAN NOT NULL DEFAULT TRUE,
  
  UNIQUE(user_id, handbook_version)
);

CREATE INDEX IF NOT EXISTS idx_ha_user ON handbook_acknowledgments(user_id);

-- ============================================================================
-- PART 6: Compliance Audit Log (Append-Only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  event_type TEXT NOT NULL, -- 'agreement_signed', 'handbook_ack', 'onboarding_step', 'access_granted', 'access_denied'
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Actor
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_role TEXT,
  
  -- Target
  target_table TEXT,
  target_id UUID,
  
  -- Context
  tenant_id UUID REFERENCES tenants(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Details
  details JSONB NOT NULL DEFAULT '{}',
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  
  -- Immutable marker
  is_immutable BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_cal_user ON compliance_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cal_event ON compliance_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_cal_timestamp ON compliance_audit_log(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_cal_tenant ON compliance_audit_log(tenant_id);

-- ============================================================================
-- PART 7: Immutability Enforcement (Prevent UPDATE/DELETE)
-- ============================================================================

-- Prevent updates to agreement acceptances
CREATE OR REPLACE FUNCTION prevent_agreement_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Agreement acceptances are immutable and cannot be modified. Record ID: %', OLD.id;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Agreement acceptances are immutable and cannot be deleted. Record ID: %', OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply immutability trigger to license_agreement_acceptances
DROP TRIGGER IF EXISTS enforce_agreement_immutability ON license_agreement_acceptances;
CREATE TRIGGER enforce_agreement_immutability
  BEFORE UPDATE OR DELETE ON license_agreement_acceptances
  FOR EACH ROW
  EXECUTE FUNCTION prevent_agreement_modification();

-- Apply immutability trigger to handbook_acknowledgments
DROP TRIGGER IF EXISTS enforce_handbook_immutability ON handbook_acknowledgments;
CREATE TRIGGER enforce_handbook_immutability
  BEFORE UPDATE OR DELETE ON handbook_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_agreement_modification();

-- Apply immutability trigger to compliance_audit_log
DROP TRIGGER IF EXISTS enforce_audit_log_immutability ON compliance_audit_log;
CREATE TRIGGER enforce_audit_log_immutability
  BEFORE UPDATE OR DELETE ON compliance_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_agreement_modification();

-- ============================================================================
-- PART 8: Agreement Validation Functions
-- ============================================================================

-- Check if user has accepted all required agreements for a given context
CREATE OR REPLACE FUNCTION check_required_agreements(
  p_user_id UUID,
  p_context TEXT DEFAULT 'student'
) RETURNS TABLE (
  agreement_type agreement_type,
  required BOOLEAN,
  accepted BOOLEAN,
  accepted_at TIMESTAMPTZ
) AS $$
DECLARE
  required_types agreement_type[];
BEGIN
  -- Define required agreements by context
  IF p_context = 'student' THEN
    required_types := ARRAY['enrollment', 'participation', 'ferpa', 'handbook']::agreement_type[];
  ELSIF p_context = 'partner' THEN
    required_types := ARRAY['mou', 'nda']::agreement_type[];
  ELSIF p_context = 'employer' THEN
    required_types := ARRAY['employer']::agreement_type[];
  ELSIF p_context = 'licensee' THEN
    required_types := ARRAY['license', 'eula', 'tos', 'aup']::agreement_type[];
  ELSE
    required_types := ARRAY['tos', 'aup']::agreement_type[];
  END IF;
  
  RETURN QUERY
  SELECT 
    av.agreement_type,
    TRUE as required,
    (laa.id IS NOT NULL) as accepted,
    laa.accepted_at
  FROM agreement_versions av
  LEFT JOIN license_agreement_acceptances laa 
    ON laa.agreement_type = av.agreement_type 
    AND laa.document_version = av.version
    AND laa.user_id = p_user_id
  WHERE av.agreement_type = ANY(required_types)
    AND av.expiry_date IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has completed onboarding
CREATE OR REPLACE FUNCTION is_onboarding_complete(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status onboarding_status;
BEGIN
  SELECT status INTO v_status
  FROM onboarding_progress
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_status = 'completed', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access LMS content
CREATE OR REPLACE FUNCTION can_access_lms(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_onboarding_complete BOOLEAN;
  v_agreements_complete BOOLEAN;
  v_handbook_complete BOOLEAN;
  v_missing_agreements TEXT[];
BEGIN
  -- Check onboarding status
  SELECT status = 'completed' INTO v_onboarding_complete
  FROM onboarding_progress
  WHERE user_id = p_user_id;
  
  -- Check required agreements
  SELECT 
    COALESCE(bool_and(accepted), FALSE),
    array_agg(agreement_type::TEXT) FILTER (WHERE NOT accepted)
  INTO v_agreements_complete, v_missing_agreements
  FROM check_required_agreements(p_user_id, 'student');
  
  -- Check handbook acknowledgment
  SELECT EXISTS (
    SELECT 1 FROM handbook_acknowledgments
    WHERE user_id = p_user_id
  ) INTO v_handbook_complete;
  
  v_result := jsonb_build_object(
    'can_access', (COALESCE(v_onboarding_complete, FALSE) AND COALESCE(v_agreements_complete, FALSE) AND COALESCE(v_handbook_complete, FALSE)),
    'onboarding_complete', COALESCE(v_onboarding_complete, FALSE),
    'agreements_complete', COALESCE(v_agreements_complete, FALSE),
    'handbook_complete', COALESCE(v_handbook_complete, FALSE),
    'missing_agreements', COALESCE(v_missing_agreements, ARRAY[]::TEXT[]),
    'redirect_to', CASE
      WHEN NOT COALESCE(v_onboarding_complete, FALSE) THEN '/student-portal/onboarding'
      WHEN NOT COALESCE(v_agreements_complete, FALSE) THEN '/student-portal/agreements'
      WHEN NOT COALESCE(v_handbook_complete, FALSE) THEN '/student-portal/handbook/acknowledge'
      ELSE NULL
    END
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 9: Audit Logging Triggers
-- ============================================================================

-- Log agreement acceptance
CREATE OR REPLACE FUNCTION log_agreement_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO compliance_audit_log (
    event_type,
    user_id,
    user_email,
    target_table,
    target_id,
    tenant_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    'agreement_signed',
    NEW.user_id,
    NEW.signer_email,
    'license_agreement_acceptances',
    NEW.id,
    NEW.tenant_id,
    jsonb_build_object(
      'agreement_type', NEW.agreement_type,
      'document_version', NEW.document_version,
      'signature_method', NEW.signature_method,
      'acceptance_context', NEW.acceptance_context
    ),
    NEW.ip_address,
    NEW.user_agent
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_agreement_acceptance_trigger ON license_agreement_acceptances;
CREATE TRIGGER log_agreement_acceptance_trigger
  AFTER INSERT ON license_agreement_acceptances
  FOR EACH ROW
  EXECUTE FUNCTION log_agreement_acceptance();

-- Log handbook acknowledgment
CREATE OR REPLACE FUNCTION log_handbook_acknowledgment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO compliance_audit_log (
    event_type,
    user_id,
    target_table,
    target_id,
    tenant_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    'handbook_ack',
    NEW.user_id,
    'handbook_acknowledgments',
    NEW.id,
    NEW.tenant_id,
    jsonb_build_object(
      'handbook_version', NEW.handbook_version,
      'attendance_policy_ack', NEW.attendance_policy_ack,
      'dress_code_ack', NEW.dress_code_ack,
      'conduct_policy_ack', NEW.conduct_policy_ack,
      'safety_policy_ack', NEW.safety_policy_ack,
      'grievance_policy_ack', NEW.grievance_policy_ack
    ),
    NEW.ip_address,
    NEW.user_agent
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_handbook_ack_trigger ON handbook_acknowledgments;
CREATE TRIGGER log_handbook_ack_trigger
  AFTER INSERT ON handbook_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION log_handbook_acknowledgment();

-- ============================================================================
-- PART 10: RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE license_agreement_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE handbook_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- License Agreement Acceptances policies
DROP POLICY IF EXISTS "Users can view own acceptances" ON license_agreement_acceptances;
CREATE POLICY "Users can view own acceptances" ON license_agreement_acceptances
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own acceptances" ON license_agreement_acceptances;
CREATE POLICY "Users can insert own acceptances" ON license_agreement_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all acceptances" ON license_agreement_acceptances;
CREATE POLICY "Staff can view all acceptances" ON license_agreement_acceptances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')
    )
  );

-- Agreement Versions policies (public read)
DROP POLICY IF EXISTS "Anyone can view agreement versions" ON agreement_versions;
CREATE POLICY "Anyone can view agreement versions" ON agreement_versions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage versions" ON agreement_versions;
CREATE POLICY "Only admins can manage versions" ON agreement_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Onboarding Progress policies
DROP POLICY IF EXISTS "Users can view own onboarding" ON onboarding_progress;
CREATE POLICY "Users can view own onboarding" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding" ON onboarding_progress;
CREATE POLICY "Users can update own onboarding" ON onboarding_progress
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding" ON onboarding_progress;
CREATE POLICY "Users can insert own onboarding" ON onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all onboarding" ON onboarding_progress;
CREATE POLICY "Staff can view all onboarding" ON onboarding_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')
    )
  );

-- Handbook Acknowledgments policies
DROP POLICY IF EXISTS "Users can view own handbook acks" ON handbook_acknowledgments;
CREATE POLICY "Users can view own handbook acks" ON handbook_acknowledgments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own handbook acks" ON handbook_acknowledgments;
CREATE POLICY "Users can insert own handbook acks" ON handbook_acknowledgments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all handbook acks" ON handbook_acknowledgments;
CREATE POLICY "Staff can view all handbook acks" ON handbook_acknowledgments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'staff', 'super_admin')
    )
  );

-- Compliance Audit Log policies (read-only for admins)
DROP POLICY IF EXISTS "Only admins can view audit log" ON compliance_audit_log;
CREATE POLICY "Only admins can view audit log" ON compliance_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- System can insert audit logs (via triggers)
DROP POLICY IF EXISTS "System can insert audit logs" ON compliance_audit_log;
CREATE POLICY "System can insert audit logs" ON compliance_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 11: Comments for Documentation
-- ============================================================================

COMMENT ON TABLE license_agreement_acceptances IS 'Immutable record of all agreement acceptances. Cannot be modified or deleted once created.';
COMMENT ON TABLE agreement_versions IS 'Tracks document versions for each agreement type. Used to determine if re-acceptance is required.';
COMMENT ON TABLE onboarding_progress IS 'Tracks user progress through onboarding steps. Used for enforcement gating.';
COMMENT ON TABLE handbook_acknowledgments IS 'Immutable record of handbook acknowledgments. Required for LMS access.';
COMMENT ON TABLE compliance_audit_log IS 'Append-only audit log for compliance events. Cannot be modified or deleted.';

COMMENT ON FUNCTION can_access_lms IS 'Returns JSON indicating if user can access LMS and what is missing if not.';
COMMENT ON FUNCTION check_required_agreements IS 'Returns table of required agreements and their acceptance status for a user.';
COMMENT ON FUNCTION is_onboarding_complete IS 'Returns boolean indicating if user has completed onboarding.';
