-- =====================================================
-- CREDENTIAL VERIFICATION SYSTEM
-- Complete implementation with audit trail
-- =====================================================

-- Credentials table (if not exists, update if exists)
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- crd_<32 chars>
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  credential_type TEXT NOT NULL,
  issuer_org_id UUID,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credentials_code ON credentials(code);
CREATE INDEX IF NOT EXISTS idx_credentials_student ON credentials(student_id);
CREATE INDEX IF NOT EXISTS idx_credentials_program ON credentials(program_id);
CREATE INDEX IF NOT EXISTS idx_credentials_issued_at ON credentials(issued_at);

-- Credential share links table
CREATE TABLE IF NOT EXISTS credential_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  credential_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  one_time_use BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON credential_share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_credential ON credential_share_links(credential_id);
CREATE INDEX IF NOT EXISTS idx_share_links_expires ON credential_share_links(expires_at);

-- Audit log table (if not exists)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Document versioning table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  audience TEXT NOT NULL CHECK (audience IN ('PUBLIC', 'STUDENT', 'PARTNER', 'ADVISOR', 'ADMIN')),
  category TEXT NOT NULL CHECK (category IN ('POLICY', 'HANDBOOK', 'FORM', 'GUIDE', 'LEGAL')),
  file_url TEXT NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_audience ON documents(audience);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- LMS identity mapping table
CREATE TABLE IF NOT EXISTS lms_identity_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lms_user_id TEXT NOT NULL,
  lms_system TEXT NOT NULL DEFAULT 'scorm_cloud',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform_user_id, lms_system)
);

CREATE INDEX IF NOT EXISTS idx_lms_mapping_platform_user ON lms_identity_mapping(platform_user_id);
CREATE INDEX IF NOT EXISTS idx_lms_mapping_lms_user ON lms_identity_mapping(lms_user_id);

-- Program schema enforcement (update existing table)
DO $$
BEGIN
  -- Add status column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'status') THEN
    ALTER TABLE programs ADD COLUMN status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED'));
  END IF;

  -- Add modality column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'modality') THEN
    ALTER TABLE programs ADD COLUMN modality TEXT CHECK (modality IN ('ONLINE', 'IN_PERSON', 'HYBRID'));
  END IF;

  -- Add duration_weeks column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'duration_weeks') THEN
    ALTER TABLE programs ADD COLUMN duration_weeks INTEGER;
  END IF;

  -- Add prerequisites column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'prerequisites') THEN
    ALTER TABLE programs ADD COLUMN prerequisites TEXT;
  END IF;

  -- Add funding_types column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'funding_types') THEN
    ALTER TABLE programs ADD COLUMN funding_types TEXT[] DEFAULT '{}';
  END IF;

  -- Add archived_at column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'archived_at') THEN
    ALTER TABLE programs ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;
END $$;

-- RLS Policies for credentials (public read for verification)
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- Public can verify credentials
CREATE POLICY "Public can verify credentials"
  ON credentials FOR SELECT
  USING (true);

-- Only admins can insert/update/delete credentials
CREATE POLICY "Admins can manage credentials"
  ON credentials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS for share links
ALTER TABLE credential_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read share links"
  ON credential_share_links FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage share links"
  ON credential_share_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS for audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'advisor')
    )
  );

CREATE POLICY "System can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active public documents"
  ON documents FOR SELECT
  USING (active = TRUE AND audience = 'PUBLIC');

CREATE POLICY "Students can read active student documents"
  ON documents FOR SELECT
  USING (
    active = TRUE 
    AND audience IN ('PUBLIC', 'STUDENT')
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );

CREATE POLICY "Partners can read active partner documents"
  ON documents FOR SELECT
  USING (
    active = TRUE 
    AND audience IN ('PUBLIC', 'PARTNER')
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'partner'
    )
  );

CREATE POLICY "Admins can manage all documents"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS for LMS mapping
ALTER TABLE lms_identity_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own LMS mapping"
  ON lms_identity_mapping FOR SELECT
  USING (platform_user_id = auth.uid());

CREATE POLICY "Admins can manage LMS mappings"
  ON lms_identity_mapping FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lms_mapping_updated_at
  BEFORE UPDATE ON lms_identity_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE credentials IS 'Issued credentials with non-guessable codes and expiration/revocation support';
COMMENT ON TABLE credential_share_links IS 'Expiring share links for credential verification';
COMMENT ON TABLE audit_log IS 'Audit trail for all credential and system events';
COMMENT ON TABLE documents IS 'Versioned documents with audience targeting and archival';
COMMENT ON TABLE lms_identity_mapping IS 'Maps platform users to LMS users for sync';
