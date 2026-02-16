-- =====================================================
-- MULTI-TENANCY SYSTEM - Complete Org Isolation
-- =====================================================

-- Tenants/Organizations (already exists as lms_organizations, enhance it)
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE;
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE;
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#10B981';
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 100;
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS max_courses INTEGER DEFAULT 10;
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS storage_limit_gb INTEGER DEFAULT 10;
ALTER TABLE lms_organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Tenant Members (link users to organizations)
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role within tenant
  tenant_role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  
  -- Permissions
  permissions JSONB DEFAULT '[]',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, invited
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, user_id)
);

-- Tenant Invitations
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  
  -- Invitation Details
  email VARCHAR(255) NOT NULL,
  tenant_role VARCHAR(50) NOT NULL DEFAULT 'member',
  
  -- Token
  invitation_token TEXT UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Audit
  invited_by UUID REFERENCES profiles(id),
  accepted_by UUID REFERENCES profiles(id),
  accepted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Branding
CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id) UNIQUE ON DELETE CASCADE,
  
  -- Logo
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  
  -- Colors
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#10B981',
  accent_color VARCHAR(7) DEFAULT '#F59E0B',
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  text_color VARCHAR(7) DEFAULT '#1F2937',
  
  -- Typography
  font_family VARCHAR(100) DEFAULT 'Inter',
  heading_font VARCHAR(100),
  
  -- Custom CSS
  custom_css TEXT,
  
  -- Email Branding
  email_header_url TEXT,
  email_footer_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Settings
CREATE TABLE IF NOT EXISTS tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id) UNIQUE ON DELETE CASCADE,
  
  -- General Settings
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(50) DEFAULT 'MM/DD/YYYY',
  time_format VARCHAR(50) DEFAULT '12h',
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Feature Flags
  features JSONB DEFAULT '{}',
  
  -- Enrollment Settings
  allow_self_enrollment BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  auto_enroll_new_users BOOLEAN DEFAULT false,
  
  -- Certificate Settings
  certificate_template_id UUID,
  auto_issue_certificates BOOLEAN DEFAULT true,
  
  -- Notification Settings
  email_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  push_notifications_enabled BOOLEAN DEFAULT true,
  
  -- Security Settings
  require_2fa BOOLEAN DEFAULT false,
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_symbols BOOLEAN DEFAULT false,
  session_timeout_minutes INTEGER DEFAULT 480,
  
  -- Integration Settings
  integrations JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Usage Tracking
CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  
  -- Usage Metrics
  active_users INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  api_requests_count INTEGER DEFAULT 0,
  
  -- Billing Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Calculated
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, period_start)
);

-- Tenant Subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  
  -- Plan Details
  plan_name VARCHAR(100) NOT NULL, -- free, starter, professional, enterprise
  plan_price DECIMAL(10,2) NOT NULL,
  billing_cycle VARCHAR(50) NOT NULL, -- monthly, yearly
  
  -- Limits
  max_users INTEGER,
  max_courses INTEGER,
  storage_limit_gb INTEGER,
  api_rate_limit INTEGER,
  
  -- Features
  features JSONB DEFAULT '[]',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, suspended
  
  -- Billing
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  
  -- Dates
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Domains
CREATE TABLE IF NOT EXISTS tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  
  -- Domain Details
  domain VARCHAR(255) UNIQUE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  
  -- Verification
  verification_token TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- SSL
  ssl_enabled BOOLEAN DEFAULT false,
  ssl_certificate TEXT,
  ssl_expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-Tenant Data Sharing (for reporting)
CREATE TABLE IF NOT EXISTS cross_tenant_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  target_tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  
  -- Access Details
  access_type VARCHAR(50) NOT NULL, -- read, write, admin
  resource_type VARCHAR(100) NOT NULL, -- courses, users, reports
  resource_ids UUID[],
  
  -- Permissions
  permissions JSONB DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_role ON tenant_members(tenant_role);

CREATE INDEX idx_tenant_invitations_tenant ON tenant_invitations(tenant_id);
CREATE INDEX idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX idx_tenant_invitations_token ON tenant_invitations(invitation_token);

CREATE INDEX idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_period ON tenant_usage(period_start, period_end);

CREATE INDEX idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status);

CREATE INDEX idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);

CREATE INDEX idx_lms_orgs_subdomain ON lms_organizations(subdomain);
CREATE INDEX idx_lms_orgs_custom_domain ON lms_organizations(custom_domain);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- Users can see their own tenant memberships
CREATE POLICY tenant_members_own ON tenant_members FOR SELECT USING (user_id = auth.uid());

-- Tenant admins can manage their tenant
CREATE POLICY tenant_members_admin ON tenant_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = tenant_members.tenant_id
    AND tm.user_id = auth.uid()
    AND tm.tenant_role IN ('owner', 'admin')
  )
);

-- Users can see invitations sent to their email
CREATE POLICY tenant_invitations_own ON tenant_invitations FOR SELECT USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

-- Tenant admins can manage invitations
CREATE POLICY tenant_invitations_admin ON tenant_invitations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = tenant_invitations.tenant_id
    AND tm.user_id = auth.uid()
    AND tm.tenant_role IN ('owner', 'admin')
  )
);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_tenant_members_updated_at BEFORE UPDATE ON tenant_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_branding_updated_at BEFORE UPDATE ON tenant_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at BEFORE UPDATE ON tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_domains_updated_at BEFORE UPDATE ON tenant_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get user's tenants
CREATE OR REPLACE FUNCTION get_user_tenants(p_user_id UUID)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name VARCHAR,
  tenant_role VARCHAR,
  subdomain VARCHAR,
  custom_domain VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    tm.tenant_role,
    o.subdomain,
    o.custom_domain
  FROM tenant_members tm
  JOIN lms_organizations o ON o.id = tm.tenant_id
  WHERE tm.user_id = p_user_id
    AND tm.status = 'active'
    AND o.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Check if user has tenant permission
CREATE OR REPLACE FUNCTION has_tenant_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_permission VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
      AND status = 'active'
      AND (
        tenant_role IN ('owner', 'admin')
        OR permissions @> jsonb_build_array(p_permission)
      )
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Calculate tenant usage
CREATE OR REPLACE FUNCTION calculate_tenant_usage(p_tenant_id UUID)
RETURNS void AS $$
DECLARE
  v_active_users INTEGER;
  v_total_courses INTEGER;
  v_total_enrollments INTEGER;
  v_storage_used DECIMAL;
BEGIN
  -- Count active users
  SELECT COUNT(DISTINCT user_id) INTO v_active_users
  FROM tenant_members
  WHERE tenant_id = p_tenant_id
    AND status = 'active';
  
  -- Count courses
  SELECT COUNT(*) INTO v_total_courses
  FROM courses
  WHERE tenant_id = p_tenant_id;
  
  -- Count enrollments
  SELECT COUNT(*) INTO v_total_enrollments
  FROM enrollments e
  JOIN courses c ON c.id = e.course_id
  WHERE c.tenant_id = p_tenant_id;
  
  -- Calculate storage (simplified)
  v_storage_used := 0; -- Would calculate actual storage
  
  -- Insert or update usage
  INSERT INTO tenant_usage (
    tenant_id,
    active_users,
    total_courses,
    total_enrollments,
    storage_used_gb,
    period_start,
    period_end
  ) VALUES (
    p_tenant_id,
    v_active_users,
    v_total_courses,
    v_total_enrollments,
    v_storage_used,
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
  )
  ON CONFLICT (tenant_id, period_start)
  DO UPDATE SET
    active_users = v_active_users,
    total_courses = v_total_courses,
    total_enrollments = v_total_enrollments,
    storage_used_gb = v_storage_used,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Create default tenant settings for existing orgs
INSERT INTO tenant_settings (tenant_id)
SELECT id FROM lms_organizations
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_settings WHERE tenant_id = lms_organizations.id
);

-- Create default tenant branding for existing orgs
INSERT INTO tenant_branding (tenant_id)
SELECT id FROM lms_organizations
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_branding WHERE tenant_id = lms_organizations.id
);

-- =====================================================
-- COMPLETE
-- =====================================================
