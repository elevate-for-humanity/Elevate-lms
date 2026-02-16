-- Multi-Tenant and Licensing System
-- Complete implementation for white-label platform

-- ============================================
-- TENANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#8B5CF6',
  accent_color TEXT DEFAULT '#10B981',
  
  -- Contact
  contact_email TEXT,
  contact_phone TEXT,
  support_email TEXT,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);

-- ============================================
-- LICENSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- License Details
  plan TEXT NOT NULL CHECK (plan IN ('trial', 'basic', 'professional', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'expired', 'cancelled')),
  
  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- Limits
  max_users INTEGER,
  max_programs INTEGER,
  max_students INTEGER,
  
  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '{
    "ai_features": false,
    "white_label": false,
    "custom_domain": false,
    "api_access": false,
    "advanced_reporting": false,
    "bulk_operations": false,
    "sso": false,
    "priority_support": false
  }',
  
  -- Billing
  monthly_price DECIMAL(10,2),
  annual_price DECIMAL(10,2),
  stripe_subscription_id TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licenses_tenant_id ON licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);

-- ============================================
-- ADD TENANT_ID TO EXISTING TABLES
-- ============================================

-- Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);

-- Applications
DO $$ 
BEGIN
  -- Student applications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_applications') THEN
    ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_student_applications_tenant_id ON student_applications(tenant_id);
  END IF;
  
  -- Program holder applications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_holder_applications') THEN
    ALTER TABLE program_holder_applications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_program_holder_applications_tenant_id ON program_holder_applications(tenant_id);
  END IF;
  
  -- Employer applications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employer_applications') THEN
    ALTER TABLE employer_applications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_employer_applications_tenant_id ON employer_applications(tenant_id);
  END IF;
  
  -- Staff applications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_applications') THEN
    ALTER TABLE staff_applications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_staff_applications_tenant_id ON staff_applications(tenant_id);
  END IF;
END $$;

-- Enrollments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_id ON enrollments(tenant_id);
  END IF;
END $$;

-- ============================================
-- RLS POLICIES FOR TENANTS
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Super admins can view all tenants
CREATE POLICY "Super admins can view all tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can view their own tenant
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Only super admins can insert/update/delete tenants
CREATE POLICY "Super admins can manage tenants"
  ON tenants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- RLS POLICIES FOR LICENSES
-- ============================================

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Super admins can view all licenses
CREATE POLICY "Super admins can view all licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Admins can view their tenant's license
CREATE POLICY "Admins can view their tenant license"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Only super admins can manage licenses
CREATE POLICY "Super admins can manage licenses"
  ON licenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- UPDATE EXISTING RLS POLICIES FOR TENANT ISOLATION
-- ============================================

-- Profiles: Users can only see profiles in their tenant
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
CREATE POLICY "Users can view profiles in their tenant"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if a feature is enabled for a tenant
CREATE OR REPLACE FUNCTION is_feature_enabled(
  p_tenant_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_license licenses;
BEGIN
  SELECT * INTO v_license
  FROM licenses
  WHERE tenant_id = p_tenant_id
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN (v_license.features->p_feature)::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if license is valid
CREATE OR REPLACE FUNCTION is_license_valid(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_license licenses;
BEGIN
  SELECT * INTO v_license
  FROM licenses
  WHERE tenant_id = p_tenant_id
  AND status = 'active'
  AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tenant by domain
CREATE OR REPLACE FUNCTION get_tenant_by_domain(p_domain TEXT)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE domain = p_domain
  AND active = true;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DEFAULT TENANT
-- ============================================

INSERT INTO tenants (
  id,
  name,
  slug,
  domain,
  primary_color,
  secondary_color,
  contact_email,
  support_email,
  active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Elevate for Humanity',
  'elevate-for-humanity',
  'www.elevateforhumanity.org',
  '#3B82F6',
  '#8B5CF6',
  'info@elevateforhumanity.org',
  'support@elevateforhumanity.org',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create default license for main tenant
INSERT INTO licenses (
  tenant_id,
  plan,
  status,
  max_users,
  max_programs,
  max_students,
  features
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'enterprise',
  'active',
  NULL, -- unlimited
  NULL, -- unlimited
  NULL, -- unlimited
  '{
    "ai_features": true,
    "white_label": true,
    "custom_domain": true,
    "api_access": true,
    "advanced_reporting": true,
    "bulk_operations": true,
    "sso": true,
    "priority_support": true
  }'
) ON CONFLICT DO NOTHING;

-- Update existing profiles to use default tenant
UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE tenants IS 'Multi-tenant organizations using the platform';
COMMENT ON TABLE licenses IS 'License and subscription information for tenants';
COMMENT ON FUNCTION is_feature_enabled IS 'Check if a specific feature is enabled for a tenant';
COMMENT ON FUNCTION is_license_valid IS 'Check if a tenant has a valid active license';
COMMENT ON FUNCTION get_tenant_by_domain IS 'Get tenant ID by domain name';
