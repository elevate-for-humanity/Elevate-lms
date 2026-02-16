-- ============================================================================
-- Elevate for Humanity - Enterprise Features Migration
-- Audit Logs, Tenant Branding, Usage Tracking
-- ============================================================================

-- Audit logs for admin actions and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
  ON audit_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs (resource_type, resource_id);

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all admin actions and system events';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., user_created, course_updated, payment_processed)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context about the action (before/after values, etc.)';

-- ============================================================================
-- Tenant Branding / White-Labeling
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_branding (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#0F766E',
  secondary_color TEXT DEFAULT '#F97316',
  accent_color TEXT DEFAULT '#3B82F6',
  custom_domain TEXT UNIQUE,
  custom_css TEXT,
  email_from_name TEXT,
  email_from_address TEXT,
  support_email TEXT,
  support_phone TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_tenant_branding_domain
  ON tenant_branding (custom_domain);

COMMENT ON TABLE tenant_branding IS 'White-label branding configuration per tenant';
COMMENT ON COLUMN tenant_branding.custom_css IS 'Custom CSS overrides for advanced branding';

-- ============================================================================
-- Tenant Usage Tracking (for billing and analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_usage_daily (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_mb NUMERIC DEFAULT 0,
  video_minutes NUMERIC DEFAULT 0,
  email_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, date)
);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_tenant_usage_date
  ON tenant_usage_daily (date DESC);

COMMENT ON TABLE tenant_usage_daily IS 'Daily usage metrics per tenant for billing and analytics';

-- ============================================================================
-- Security: Password History (prevent password reuse)
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user
  ON password_history (user_id, created_at DESC);

COMMENT ON TABLE password_history IS 'Track password history to prevent reuse (enterprise security requirement)';

-- ============================================================================
-- Session Management (track active sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user
  ON user_sessions (user_id, last_active_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token
  ON user_sessions (session_token);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
  ON user_sessions (expires_at);

COMMENT ON TABLE user_sessions IS 'Track active user sessions for security and session management';

-- ============================================================================
-- API Keys (for programmatic access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant
  ON api_keys (tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON api_keys (key_hash);

COMMENT ON TABLE api_keys IS 'API keys for programmatic access to the platform';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters of key for identification (e.g., "efh_live_")';
COMMENT ON COLUMN api_keys.permissions IS 'Array of permission scopes (e.g., ["read:courses", "write:enrollments"])';

-- ============================================================================
-- Compliance: Data Retention Policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  auto_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, data_type)
);

COMMENT ON TABLE data_retention_policies IS 'Data retention policies for GDPR/CCPA compliance';
COMMENT ON COLUMN data_retention_policies.data_type IS 'Type of data (e.g., "audit_logs", "user_data", "course_progress")';

-- ============================================================================
-- Security: Failed Login Attempts (brute force protection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email
  ON failed_login_attempts (email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_login_ip
  ON failed_login_attempts (ip_address, attempted_at DESC);

COMMENT ON TABLE failed_login_attempts IS 'Track failed login attempts for security monitoring and brute force protection';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Audit logs: Only admins and service role can read
CREATE POLICY audit_logs_admin_read ON audit_logs
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Tenant branding: Tenant members can read, admins can write
CREATE POLICY tenant_branding_read ON tenant_branding
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY tenant_branding_write ON tenant_branding
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Usage tracking: Only admins can read
CREATE POLICY tenant_usage_admin_read ON tenant_usage_daily
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Sessions: Users can only see their own sessions
CREATE POLICY user_sessions_own ON user_sessions
  FOR ALL
  USING (user_id = auth.uid());

-- API keys: Tenant admins only
CREATE POLICY api_keys_tenant_admin ON api_keys
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- Functions for common operations
-- ============================================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    tenant_id, user_id, action, resource_type, resource_id,
    metadata, ip_address, user_agent
  ) VALUES (
    p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id,
    p_metadata, p_ip_address, p_user_agent
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tenant usage
CREATE OR REPLACE FUNCTION update_tenant_usage(
  p_tenant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_active_users INTEGER DEFAULT 0,
  p_new_users INTEGER DEFAULT 0,
  p_api_calls INTEGER DEFAULT 0,
  p_storage_mb NUMERIC DEFAULT 0,
  p_video_minutes NUMERIC DEFAULT 0,
  p_email_sent INTEGER DEFAULT 0,
  p_sms_sent INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO tenant_usage_daily (
    tenant_id, date, active_users, new_users, api_calls,
    storage_mb, video_minutes, email_sent, sms_sent
  ) VALUES (
    p_tenant_id, p_date, p_active_users, p_new_users, p_api_calls,
    p_storage_mb, p_video_minutes, p_email_sent, p_sms_sent
  )
  ON CONFLICT (tenant_id, date) DO UPDATE SET
    active_users = tenant_usage_daily.active_users + EXCLUDED.active_users,
    new_users = tenant_usage_daily.new_users + EXCLUDED.new_users,
    api_calls = tenant_usage_daily.api_calls + EXCLUDED.api_calls,
    storage_mb = tenant_usage_daily.storage_mb + EXCLUDED.storage_mb,
    video_minutes = tenant_usage_daily.video_minutes + EXCLUDED.video_minutes,
    email_sent = tenant_usage_daily.email_sent + EXCLUDED.email_sent,
    sms_sent = tenant_usage_daily.sms_sent + EXCLUDED.sms_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp on tenant_branding
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenant_branding_updated_at
  BEFORE UPDATE ON tenant_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Insert default branding for existing tenants (if any)
INSERT INTO tenant_branding (tenant_id, name, primary_color, secondary_color)
SELECT id, name, '#0F766E', '#F97316'
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_branding)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================================
-- Grants
-- ============================================================================

-- Grant necessary permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT ON tenant_branding TO authenticated;
GRANT SELECT ON tenant_usage_daily TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_sessions TO authenticated;
GRANT SELECT ON api_keys TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration record
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
    CREATE TABLE schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
  
  INSERT INTO schema_migrations (version) VALUES ('20251118_enterprise_audit_and_branding')
  ON CONFLICT (version) DO NOTHING;
END $$;
