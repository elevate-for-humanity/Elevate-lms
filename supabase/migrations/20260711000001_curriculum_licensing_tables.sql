-- Curriculum Licensing Platform Tables
-- Stores curriculum metadata, licenses, and version management

-- Curriculum metadata
CREATE TABLE IF NOT EXISTS curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  credential_slug TEXT,
  provider TEXT,
  category TEXT,
  version TEXT NOT NULL DEFAULT 'v1.0.0',
  copyright TEXT DEFAULT '© 2026 Elevate for Humanity',
  all_rights_reserved BOOLEAN DEFAULT true,
  license_required BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  production_ready BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 0,
  readiness_report JSONB,
  
  -- Compliance
  wioa_eligible BOOLEAN DEFAULT true,
  etpl_approved BOOLEAN DEFAULT false,
  accredited BOOLEAN DEFAULT false,
  
  -- Metadata
  credentials TEXT[],
  standards TEXT[],
  competencies TEXT[],
  learning_objectives TEXT[],
  assessments TEXT[],
  media_assets TEXT[],
  
  -- Change log
  change_log JSONB DEFAULT '[]'::jsonb,
  
  -- Analytics
  schools TEXT[],
  total_enrollments INTEGER DEFAULT 0,
  average_completion DECIMAL(5,2) DEFAULT 0,
  average_satisfaction DECIMAL(5,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  renewal_due TIMESTAMPTZ,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_curricula_slug ON curricula(slug);
CREATE INDEX IF NOT EXISTS idx_curricula_status ON curricula(status);
CREATE INDEX IF NOT EXISTS idx_curricula_category ON curricula(category);
CREATE INDEX IF NOT EXISTS idx_curricula_credential ON curricula(credential_slug);

-- Curriculum versions
CREATE TABLE IF NOT EXISTS curriculum_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog JSONB DEFAULT '[]'::jsonb,
  content_hash TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  
  UNIQUE(curriculum_id, version)
);

CREATE INDEX IF NOT EXISTS idx_cv_curriculum ON curriculum_versions(curriculum_id);

-- Curriculum licenses
CREATE TABLE IF NOT EXISTS curriculum_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE,
  curriculum_version TEXT,
  
  -- School info
  school_id UUID,
  school_name TEXT,
  school_email TEXT,
  
  -- License terms
  license_type TEXT NOT NULL CHECK (license_type IN ('Standard', 'Professional', 'Enterprise')),
  duration_months INTEGER DEFAULT 12,
  price_per_student DECIMAL(10,2),
  minimum_students INTEGER DEFAULT 10,
  annual_maintenance DECIMAL(10,2) DEFAULT 500,
  
  -- Entitlements
  student_seats INTEGER DEFAULT 50,
  instructor_accounts INTEGER DEFAULT 5,
  admin_accounts INTEGER DEFAULT 2,
  api_access BOOLEAN DEFAULT false,
  custom_branding BOOLEAN DEFAULT false,
  support_level TEXT DEFAULT 'email',
  
  -- Restrictions
  modify_content BOOLEAN DEFAULT false,
  resell BOOLEAN DEFAULT false,
  sublicense BOOLEAN DEFAULT false,
  transfer BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'cancelled')),
  auto_renew BOOLEAN DEFAULT true,
  renewal_eligible BOOLEAN DEFAULT true,
  renewal_discount DECIMAL(5,2) DEFAULT 0.10,
  
  -- Dates
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  invoice_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cl_curriculum ON curriculum_licenses(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_cl_school ON curriculum_licenses(school_id);
CREATE INDEX IF NOT EXISTS idx_cl_status ON curriculum_licenses(status);
CREATE INDEX IF NOT EXISTS idx_cl_expires ON curriculum_licenses(expires_at);

-- License changes log
CREATE TABLE IF NOT EXISTS license_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES curriculum_licenses(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('version', 'renewal', 'upgrade', 'downgrade', 'cancellation', 'seats')),
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lc_license ON license_changes(license_id);

-- Curriculum readiness reports
CREATE TABLE IF NOT EXISTS readiness_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE,
  version TEXT,
  
  -- Overall score
  overall_score INTEGER NOT NULL,
  threshold INTEGER DEFAULT 95,
  is_ready BOOLEAN DEFAULT false,
  
  -- Category scores
  credential_alignment INTEGER,
  blueprint_coverage INTEGER,
  competency_coverage INTEGER,
  assessment_quality INTEGER,
  hands_on_skills INTEGER,
  media_complete INTEGER,
  accessibility INTEGER,
  licensing_metadata INTEGER,
  
  -- Details
  report JSONB NOT NULL,
  issues JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rr_curriculum ON readiness_reports(curriculum_id);

-- Schools (reference table)
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  email TEXT UNIQUE,
  phone TEXT,
  address JSONB,
  website TEXT,
  
  -- Account
  account_manager TEXT,
  account_status TEXT DEFAULT 'active',
  
  -- Totals
  total_licenses INTEGER DEFAULT 0,
  total_spend DECIMAL(12,2) DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);

-- Course factory jobs
CREATE TABLE IF NOT EXISTS course_factory_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT UNIQUE NOT NULL,
  credential_slug TEXT,
  credential_name TEXT,
  
  -- User
  requested_by UUID REFERENCES auth.users(id),
  requested_by_email TEXT,
  
  -- Progress
  stage TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Result
  curriculum_id UUID REFERENCES curricula(id),
  quality_score INTEGER,
  readiness_report JSONB,
  error TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Timing
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Meta
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cfj_status ON course_factory_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cfj_requested_by ON course_factory_jobs(requested_by);

-- Instructor profiles
CREATE TABLE IF NOT EXISTS instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE,
  
  -- Identity
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  voice_style TEXT DEFAULT 'professional',
  personality TEXT,
  
  -- Expertise
  expertise TEXT[],
  years_experience INTEGER,
  
  -- Media
  video_intro_url TEXT,
  demo_video_url TEXT,
  
  -- Stats
  total_courses INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_curriculum ON instructor_profiles(curriculum_id);

-- Blueprint monitoring
CREATE TABLE IF NOT EXISTS blueprint_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_slug TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  
  -- Status
  last_checked TIMESTAMPTZ,
  last_status TEXT DEFAULT 'current',
  last_version TEXT,
  
  -- Changes
  changes_detected INTEGER DEFAULT 0,
  last_change_at TIMESTAMPTZ,
  change_history JSONB DEFAULT '[]'::jsonb,
  
  -- Notifications
  notify_on_change BOOLEAN DEFAULT true,
  notify_emails TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bm_credential ON blueprint_monitors(credential_slug);

-- Functions
CREATE OR REPLACE FUNCTION update_curriculum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_license_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trg_curricula_updated_at ON curricula;
CREATE TRIGGER trg_curricula_updated_at BEFORE UPDATE ON curricula
FOR EACH ROW EXECUTE FUNCTION update_curriculum_updated_at();

DROP TRIGGER IF EXISTS trg_licenses_updated_at ON curriculum_licenses;
CREATE TRIGGER trg_licenses_updated_at BEFORE UPDATE ON curriculum_licenses
FOR EACH ROW EXECUTE FUNCTION update_license_updated_at();

-- Grant permissions (adjust as needed)
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Basic policies (customize for your auth setup)
CREATE POLICY "Public read curricula" ON curricula FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage curricula" ON curricula FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Seed data: license types
INSERT INTO curriculum_licenses (license_key, license_type, price_per_student, minimum_students, annual_maintenance)
VALUES 
  ('LIC-STANDARD', 'Standard', 25.00, 10, 500.00),
  ('LIC-PROFESSIONAL', 'Professional', 20.00, 25, 1000.00),
  ('LIC-ENTERPRISE', 'Enterprise', 15.00, 100, 5000.00)
ON CONFLICT (license_key) DO NOTHING;

COMMENT ON TABLE curricula IS 'Stores all curriculum metadata with versioning and licensing info';
COMMENT ON TABLE curriculum_licenses IS 'School licenses for curriculum access';
COMMENT ON TABLE schools IS 'School accounts with license aggregation';
COMMENT ON TABLE course_factory_jobs IS 'PARIS Course Factory job tracking';
COMMENT ON TABLE readiness_reports IS 'Curriculum Readiness Reports (QA gate)';
