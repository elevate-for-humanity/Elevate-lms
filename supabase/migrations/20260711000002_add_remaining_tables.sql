-- Additional Tables for Curriculum Licensing Platform
-- These tables are needed but not yet created

-- Curriculum versions (version history)
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

-- Curriculum licenses (school licenses)
CREATE TABLE IF NOT EXISTS curriculum_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE,
  curriculum_version TEXT,
  school_id UUID,
  school_name TEXT,
  school_email TEXT,
  license_type TEXT NOT NULL CHECK (license_type IN ('Standard', 'Professional', 'Enterprise')),
  duration_months INTEGER DEFAULT 12,
  student_seats INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cl_curriculum ON curriculum_licenses(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_cl_school ON curriculum_licenses(school_id);

-- Schools (school accounts)
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  license_count INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);

-- Course factory jobs (build job tracking)
CREATE TABLE IF NOT EXISTS course_factory_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cfj_status ON course_factory_jobs(status);

-- Blueprint monitors (blueprint monitoring)
CREATE TABLE IF NOT EXISTS blueprint_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  standards JSONB DEFAULT '[]'::jsonb,
  last_checked TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bm_type ON blueprint_monitors(blueprint_type);
