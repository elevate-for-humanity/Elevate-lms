-- ============================================================================
-- SCORM and xAPI Support
-- Learning content packages and experience tracking
-- ============================================================================

-- SCORM packages (uploaded ZIPs / manifests)
CREATE TABLE IF NOT EXISTS scorm_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  version TEXT,
  storage_path TEXT NOT NULL, -- e.g. "scorm/tenant-id/package-id.zip"
  manifest_data JSONB, -- Parsed imsmanifest.xml
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scorm_packages_tenant
  ON scorm_packages(tenant_id, created_at DESC);

-- SCORM registrations (which learner is taking which package)
CREATE TABLE IF NOT EXISTS scorm_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES scorm_packages(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started | in_progress | completed | failed
  score NUMERIC(5,2),
  total_time INTERVAL,
  suspend_data TEXT, -- SCORM suspend_data for resume
  last_launched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(package_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_scorm_registrations_learner
  ON scorm_registrations(learner_id, status);

CREATE INDEX IF NOT EXISTS idx_scorm_registrations_package
  ON scorm_registrations(package_id, status);

-- xAPI statements (Experience API / Tin Can API)
CREATE TABLE IF NOT EXISTS xapi_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  raw JSONB NOT NULL,
  verb TEXT,
  object_id TEXT,
  object_type TEXT,
  result JSONB,
  context JSONB,
  stored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xapi_learner
  ON xapi_statements(learner_id, stored_at DESC);

CREATE INDEX IF NOT EXISTS idx_xapi_verb
  ON xapi_statements(verb, stored_at DESC);

CREATE INDEX IF NOT EXISTS idx_xapi_object
  ON xapi_statements(object_id, stored_at DESC);

CREATE INDEX IF NOT EXISTS idx_xapi_tenant
  ON xapi_statements(tenant_id, stored_at DESC);

-- Full-text search on xAPI statements
CREATE INDEX IF NOT EXISTS idx_xapi_raw_gin
  ON xapi_statements USING gin(raw);

-- Enable RLS
ALTER TABLE scorm_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorm_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE xapi_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SCORM packages
CREATE POLICY scorm_packages_tenant_read ON scorm_packages
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY scorm_packages_admin_write ON scorm_packages
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'instructor')
    )
  );

-- RLS Policies for SCORM registrations
CREATE POLICY scorm_registrations_own ON scorm_registrations
  FOR SELECT
  USING (
    learner_id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'instructor')
    )
  );

CREATE POLICY scorm_registrations_create ON scorm_registrations
  FOR INSERT
  WITH CHECK (learner_id = auth.uid());

CREATE POLICY scorm_registrations_update_own ON scorm_registrations
  FOR UPDATE
  USING (learner_id = auth.uid());

-- RLS Policies for xAPI statements
CREATE POLICY xapi_statements_own ON xapi_statements
  FOR SELECT
  USING (
    learner_id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'instructor')
    )
  );

CREATE POLICY xapi_statements_insert ON xapi_statements
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts (from LRS)

-- Comments
COMMENT ON TABLE scorm_packages IS 'SCORM content packages uploaded to the LMS';
COMMENT ON TABLE scorm_registrations IS 'Learner enrollments in SCORM packages';
COMMENT ON TABLE xapi_statements IS 'xAPI/Tin Can API learning experience statements';

COMMENT ON COLUMN scorm_packages.storage_path IS 'Path to SCORM ZIP file in storage (S3, Supabase Storage, etc.)';
COMMENT ON COLUMN scorm_packages.manifest_data IS 'Parsed imsmanifest.xml for SCORM metadata';
COMMENT ON COLUMN scorm_registrations.suspend_data IS 'SCORM suspend_data for resuming where learner left off';
COMMENT ON COLUMN xapi_statements.raw IS 'Full xAPI statement JSON';
