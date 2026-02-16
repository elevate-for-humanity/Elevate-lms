-- =====================================================
-- SSO CONNECTIONS (Enterprise Single Sign-On)
-- Migration: 20241118_sso_connections.sql
-- =====================================================

-- SSO Connections Table
CREATE TABLE IF NOT EXISTS sso_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL, -- okta, azure_ad, google_workspace, generic_saml, generic_oidc
  domain VARCHAR(255), -- optional tenant domain (e.g., company.com)
  display_name VARCHAR(255) NOT NULL,
  
  -- SAML Configuration
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_x509_cert TEXT,
  saml_sign_requests BOOLEAN DEFAULT false,
  
  -- OAuth/OIDC Configuration
  oauth_client_id TEXT,
  oauth_client_secret TEXT,
  oauth_authorize_url TEXT,
  oauth_token_url TEXT,
  oauth_userinfo_url TEXT,
  oauth_scopes TEXT[] DEFAULT '{"openid", "email", "profile"}',
  
  -- Attribute Mapping
  mapping_rules JSONB DEFAULT '{
    "email": "email",
    "first_name": "given_name",
    "last_name": "family_name",
    "full_name": "name",
    "role": "custom:role"
  }'::jsonb,
  
  -- Default role for new users from this connection
  default_role VARCHAR(50) DEFAULT 'student',
  
  -- Status
  is_enabled BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false, -- if true, use for all users from this domain
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one default connection per domain
  UNIQUE (domain, is_default) WHERE is_default = true
);

-- SSO Login Attempts (for auditing)
CREATE TABLE IF NOT EXISTS sso_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES sso_connections(id) ON DELETE CASCADE,
  email VARCHAR(255),
  profile_id UUID REFERENCES profiles(id),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sso_connections_provider ON sso_connections(provider);
CREATE INDEX IF NOT EXISTS idx_sso_connections_domain ON sso_connections(domain);
CREATE INDEX IF NOT EXISTS idx_sso_connections_is_enabled ON sso_connections(is_enabled);
CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_connection_id ON sso_login_attempts(connection_id);
CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_email ON sso_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_created_at ON sso_login_attempts(created_at);

-- Enable Row Level Security
ALTER TABLE sso_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view SSO connections
CREATE POLICY "Admin can view SSO connections"
  ON sso_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can manage SSO connections
CREATE POLICY "Admin can manage SSO connections"
  ON sso_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can view login attempts
CREATE POLICY "Admin can view login attempts"
  ON sso_login_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert login attempts
CREATE POLICY "System can insert login attempts"
  ON sso_login_attempts FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE sso_connections IS 'Enterprise SSO connections (SAML, OAuth, OIDC)';
COMMENT ON TABLE sso_login_attempts IS 'Audit log for SSO login attempts';
COMMENT ON COLUMN sso_connections.mapping_rules IS 'JSON mapping of SSO attributes to profile fields';
COMMENT ON COLUMN sso_connections.default_role IS 'Default role assigned to new users from this SSO connection';
