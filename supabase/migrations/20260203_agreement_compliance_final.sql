-- ============================================================================
-- Agreement Compliance Enforcement - Final Migration
-- Single source of truth for all agreement acceptances
-- ============================================================================

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS license_agreement_acceptances CASCADE;

-- Create the canonical agreement acceptances table
CREATE TABLE license_agreement_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Agreement identification
  agreement_type TEXT NOT NULL,
  document_version TEXT NOT NULL DEFAULT '1.0',
  document_url TEXT,
  
  -- Signer information
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  auth_email TEXT, -- Email from auth at signing time
  
  -- Signature capture
  signature_method TEXT NOT NULL DEFAULT 'checkbox', -- checkbox, typed, drawn
  signature_typed TEXT,
  signature_data TEXT, -- Base64 for drawn signatures
  
  -- Audit trail
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT NOT NULL DEFAULT '0.0.0.0',
  user_agent TEXT NOT NULL DEFAULT 'unknown',
  
  -- Context
  acceptance_context TEXT DEFAULT 'onboarding',
  role_at_signing TEXT,
  organization_id UUID,
  tenant_id UUID,
  program_id UUID,
  
  -- Legal
  legal_acknowledgment BOOLEAN NOT NULL DEFAULT TRUE,
  is_immutable BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Unique constraint: one acceptance per user per agreement type per version
  CONSTRAINT unique_user_agreement UNIQUE(user_id, agreement_type, document_version)
);

-- Indexes for performance
CREATE INDEX idx_laa_user_id ON license_agreement_acceptances(user_id);
CREATE INDEX idx_laa_agreement_type ON license_agreement_acceptances(agreement_type);
CREATE INDEX idx_laa_accepted_at ON license_agreement_acceptances(accepted_at);

-- Enable RLS
ALTER TABLE license_agreement_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own acceptances
CREATE POLICY "Users can view own acceptances" 
  ON license_agreement_acceptances FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own acceptances
CREATE POLICY "Users can insert own acceptances" 
  ON license_agreement_acceptances FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Staff/admin can view all acceptances
CREATE POLICY "Staff can view all acceptances" 
  ON license_agreement_acceptances FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'super_admin')
    )
  );

-- Prevent updates (immutability)
CREATE POLICY "No updates allowed" 
  ON license_agreement_acceptances FOR UPDATE 
  USING (false);

-- Prevent deletes (immutability)
CREATE POLICY "No deletes allowed" 
  ON license_agreement_acceptances FOR DELETE 
  USING (false);

-- ============================================================================
-- Agreement Versions Table (tracks current versions)
-- ============================================================================

DROP TABLE IF EXISTS agreement_versions CASCADE;

CREATE TABLE agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_type TEXT NOT NULL UNIQUE,
  current_version TEXT NOT NULL DEFAULT '1.0',
  document_url TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial versions
INSERT INTO agreement_versions (agreement_type, current_version, document_url) VALUES
  ('enrollment', '1.0', '/legal/enrollment-agreement'),
  ('handbook', '1.0', '/legal/student-handbook'),
  ('data_sharing', '1.0', '/legal/data-sharing'),
  ('program_holder_mou', '1.0', '/legal/program-holder-mou'),
  ('employer_agreement', '1.0', '/legal/employer-agreement'),
  ('staff_agreement', '1.0', '/legal/staff-agreement'),
  ('mou', '1.0', '/legal/partner-mou'),
  ('ferpa', '1.0', '/legal/ferpa-consent'),
  ('participation', '1.0', '/legal/participation-agreement')
ON CONFLICT (agreement_type) DO NOTHING;

-- Enable RLS
ALTER TABLE agreement_versions ENABLE ROW LEVEL SECURITY;

-- Anyone can read versions
CREATE POLICY "Anyone can view versions" 
  ON agreement_versions FOR SELECT 
  USING (true);

-- ============================================================================
-- Helper function to check if user has signed required agreements
-- ============================================================================

CREATE OR REPLACE FUNCTION check_user_agreements(
  p_user_id UUID,
  p_required_types TEXT[]
)
RETURNS TABLE (
  agreement_type TEXT,
  is_signed BOOLEAN,
  signed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    req.type,
    (laa.id IS NOT NULL) as is_signed,
    laa.accepted_at as signed_at
  FROM unnest(p_required_types) AS req(type)
  LEFT JOIN license_agreement_acceptances laa 
    ON laa.agreement_type = req.type 
    AND laa.user_id = p_user_id
    AND laa.document_version = COALESCE(
      (SELECT current_version FROM agreement_versions WHERE agreement_type = req.type),
      '1.0'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE license_agreement_acceptances IS 
  'Canonical table for all agreement acceptances. Immutable - no updates or deletes allowed.';

COMMENT ON TABLE agreement_versions IS 
  'Tracks current versions of each agreement type.';

COMMENT ON FUNCTION check_user_agreements IS 
  'Returns signing status for a list of required agreement types.';
