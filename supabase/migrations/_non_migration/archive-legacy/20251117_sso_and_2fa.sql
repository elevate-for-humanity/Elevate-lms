-- =====================================================
-- SSO AND TWO-FACTOR AUTHENTICATION
-- =====================================================

-- SSO Providers Configuration
CREATE TABLE IF NOT EXISTS sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id),
  provider_type VARCHAR(50) NOT NULL, -- saml, oauth, ldap, azure_ad, google
  provider_name VARCHAR(255) NOT NULL,
  
  -- Configuration (stored as JSON)
  config JSONB NOT NULL,
  
  -- Metadata
  metadata JSONB,
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO Sessions
CREATE TABLE IF NOT EXISTS sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  provider_id UUID REFERENCES sso_providers(id),
  
  -- Session Details
  session_token TEXT UNIQUE NOT NULL,
  saml_session_index TEXT,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Two-Factor Authentication
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  
  -- Secret
  secret TEXT NOT NULL,
  
  -- Backup Codes
  backup_codes TEXT[],
  
  -- Status
  enabled BOOLEAN DEFAULT false,
  
  -- Recovery
  recovery_email VARCHAR(255),
  recovery_phone VARCHAR(50),
  
  -- Audit
  enabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2FA Verification Attempts
CREATE TABLE IF NOT EXISTS two_factor_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  
  -- Attempt Details
  token_used TEXT,
  success BOOLEAN NOT NULL,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys (for REST API access)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES lms_organizations(id),
  
  -- Key Details
  key_name VARCHAR(255) NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  api_secret TEXT NOT NULL,
  
  -- Permissions
  scopes TEXT[], -- Array of permission scopes
  
  -- Rate Limiting
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Usage
  last_used_at TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Request Logs
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id),
  
  -- Request Details
  method VARCHAR(10) NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  
  -- Timing
  response_time_ms INTEGER,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Error
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  
  -- Session Details
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT,
  
  -- Device Info
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- desktop, mobile, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Location
  ip_address VARCHAR(45),
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Audit Logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- login, logout, password_change, 2fa_enabled, etc.
  event_description TEXT,
  
  -- Result
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  location JSONB,
  
  -- Risk Assessment
  risk_level VARCHAR(50), -- low, medium, high, critical
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password History (for password policy enforcement)
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  
  -- Password Hash
  password_hash TEXT NOT NULL,
  
  -- Metadata
  changed_by UUID REFERENCES profiles(id),
  change_reason VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IP Whitelist/Blacklist
CREATE TABLE IF NOT EXISTS ip_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id),
  
  -- IP Details
  ip_address VARCHAR(45) NOT NULL,
  ip_range_start VARCHAR(45),
  ip_range_end VARCHAR(45),
  
  -- Access Type
  access_type VARCHAR(50) NOT NULL, -- whitelist, blacklist
  
  -- Reason
  reason TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_sso_providers_tenant ON sso_providers(tenant_id);
CREATE INDEX idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX idx_sso_sessions_token ON sso_sessions(session_token);

CREATE INDEX idx_two_factor_user ON two_factor_auth(user_id);
CREATE INDEX idx_two_factor_attempts_user ON two_factor_attempts(user_id);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);

CREATE INDEX idx_api_logs_key ON api_request_logs(api_key_id);
CREATE INDEX idx_api_logs_created ON api_request_logs(created_at);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

CREATE INDEX idx_security_logs_user ON security_audit_logs(user_id);
CREATE INDEX idx_security_logs_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_logs_created ON security_audit_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own 2FA settings
CREATE POLICY two_factor_own ON two_factor_auth FOR SELECT USING (user_id = auth.uid());

-- Users can see their own sessions
CREATE POLICY user_sessions_own ON user_sessions FOR SELECT USING (user_id = auth.uid());

-- Users can see their own security logs
CREATE POLICY security_logs_own ON security_audit_logs FOR SELECT USING (user_id = auth.uid());

-- Admins can see everything
CREATE POLICY sso_providers_admin ON sso_providers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_sso_providers_updated_at BEFORE UPDATE ON sso_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_two_factor_updated_at BEFORE UPDATE ON two_factor_auth
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type VARCHAR,
  p_event_description TEXT,
  p_success BOOLEAN,
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_logs (
    user_id,
    event_type,
    event_description,
    success,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_description,
    p_success,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if IP is allowed
CREATE OR REPLACE FUNCTION is_ip_allowed(
  p_tenant_id UUID,
  p_ip_address VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_whitelist_count INTEGER;
  v_blacklist_count INTEGER;
BEGIN
  -- Check if IP is blacklisted
  SELECT COUNT(*) INTO v_blacklist_count
  FROM ip_access_control
  WHERE tenant_id = p_tenant_id
    AND access_type = 'blacklist'
    AND ip_address = p_ip_address
    AND is_active = true;
  
  IF v_blacklist_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Check if whitelist exists
  SELECT COUNT(*) INTO v_whitelist_count
  FROM ip_access_control
  WHERE tenant_id = p_tenant_id
    AND access_type = 'whitelist'
    AND is_active = true;
  
  -- If no whitelist, allow all (except blacklisted)
  IF v_whitelist_count = 0 THEN
    RETURN true;
  END IF;
  
  -- Check if IP is whitelisted
  SELECT COUNT(*) INTO v_whitelist_count
  FROM ip_access_control
  WHERE tenant_id = p_tenant_id
    AND access_type = 'whitelist'
    AND ip_address = p_ip_address
    AND is_active = true;
  
  RETURN v_whitelist_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETE
-- =====================================================
