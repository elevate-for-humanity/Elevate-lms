-- License Agreement Acceptance Tracking
-- Logs acceptance of EULA, Terms, AUP, Disclosures for legal enforceability

-- Agreement types enum
CREATE TYPE agreement_type AS ENUM (
  'eula',           -- End User License Agreement
  'tos',            -- Terms of Service
  'aup',            -- Acceptable Use Policy
  'disclosures',    -- Disclosures and Disclaimers
  'license',        -- License Agreement (for licensees)
  'nda',            -- Non-Disclosure Agreement
  'mou'             -- Memorandum of Understanding (agencies only)
);

-- Agreement acceptances table
CREATE TABLE IF NOT EXISTS license_agreement_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Agreement details
  agreement_type agreement_type NOT NULL,
  document_version TEXT NOT NULL,
  document_url TEXT, -- Link to the specific version
  
  -- Digital signature fields
  signer_name TEXT NOT NULL,              -- Full legal name
  signer_title TEXT,                       -- Job title (for org representatives)
  signer_email TEXT NOT NULL,              -- Email at time of signing
  signature_data TEXT,                     -- Base64 encoded signature image (if drawn)
  signature_typed TEXT,                    -- Typed signature (if typed)
  signature_method TEXT DEFAULT 'checkbox', -- 'checkbox', 'typed', 'drawn'
  
  -- Acceptance metadata
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Context
  acceptance_context TEXT, -- 'checkout', 'first_login', 'upgrade', 'renewal'
  stripe_session_id TEXT, -- If accepted during checkout
  
  -- Legal acknowledgment
  legal_acknowledgment BOOLEAN DEFAULT TRUE, -- Confirms they read and understood
  
  -- Ensure one acceptance per user per document version
  UNIQUE(user_id, agreement_type, document_version)
);

-- Index for quick lookups
CREATE INDEX idx_agreement_acceptances_user ON license_agreement_acceptances(user_id);
CREATE INDEX idx_agreement_acceptances_org ON license_agreement_acceptances(organization_id);
CREATE INDEX idx_agreement_acceptances_type ON license_agreement_acceptances(agreement_type);

-- Agreement versions table (tracks current versions)
CREATE TABLE IF NOT EXISTS agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_type agreement_type NOT NULL UNIQUE,
  current_version TEXT NOT NULL,
  effective_date DATE NOT NULL,
  document_url TEXT NOT NULL,
  summary_of_changes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial versions
INSERT INTO agreement_versions (agreement_type, current_version, effective_date, document_url) VALUES
  ('eula', '1.0', '2026-01-22', '/legal/eula'),
  ('tos', '1.0', '2026-01-22', '/legal/terms-of-service'),
  ('aup', '1.0', '2026-01-22', '/legal/acceptable-use'),
  ('disclosures', '1.0', '2026-01-22', '/legal/disclosures'),
  ('license', '1.0', '2026-01-22', '/legal/license-agreement')
ON CONFLICT (agreement_type) DO NOTHING;

-- Function to check if user has accepted all required agreements
CREATE OR REPLACE FUNCTION has_accepted_required_agreements(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  required_types agreement_type[] := ARRAY['eula', 'tos', 'aup', 'disclosures']::agreement_type[];
  accepted_count INT;
BEGIN
  SELECT COUNT(DISTINCT laa.agreement_type)
  INTO accepted_count
  FROM license_agreement_acceptances laa
  JOIN agreement_versions av ON laa.agreement_type = av.agreement_type 
    AND laa.document_version = av.current_version
  WHERE laa.user_id = p_user_id
    AND laa.agreement_type = ANY(required_types);
  
  RETURN accepted_count = array_length(required_types, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if licensee has accepted license agreement
CREATE OR REPLACE FUNCTION has_accepted_license_agreement(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM license_agreement_acceptances laa
    JOIN agreement_versions av ON laa.agreement_type = av.agreement_type 
      AND laa.document_version = av.current_version
    WHERE laa.user_id = p_user_id
      AND laa.agreement_type = 'license'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE license_agreement_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_versions ENABLE ROW LEVEL SECURITY;

-- Users can view their own acceptances
CREATE POLICY "Users can view own acceptances" ON license_agreement_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own acceptances
CREATE POLICY "Users can accept agreements" ON license_agreement_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Agreement versions are public (read-only)
CREATE POLICY "Agreement versions are public" ON agreement_versions
  FOR SELECT USING (true);

-- Admins can view all acceptances
CREATE POLICY "Admins can view all acceptances" ON license_agreement_acceptances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

COMMENT ON TABLE license_agreement_acceptances IS 'Tracks user acceptance of legal agreements for enforceability';
COMMENT ON TABLE agreement_versions IS 'Current versions of each agreement type';
