-- Migration: Create Unified Control Plane tables
-- Purpose: Central command center for entire platform

CREATE TABLE IF NOT EXISTS platform_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- 'website', 'lms', 'admin', 'api', 'database', 'storage', 'dns', 'deployment', 'ai', 'workflow', 'cdn', 'email', 'analytics'
  url VARCHAR(500),
  provider VARCHAR(100), -- 'vercel', 'northflank', 'supabase', 'cloudflare', 'github', 'openai', etc.
  environment VARCHAR(50) DEFAULT 'production', -- 'production', 'staging', 'development'
  status VARCHAR(50) DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown', 'maintenance'
  last_health_check TIMESTAMPTZ,
  health_check_interval_seconds INTEGER DEFAULT 60,
  uptime_percent DECIMAL(5,2) DEFAULT 100.00,
  owner_role VARCHAR(100),
  related_env_vars JSONB DEFAULT '[]',
  related_repo_paths JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  service_id UUID REFERENCES platform_services(id) ON DELETE CASCADE,
  check_type VARCHAR(100) NOT NULL, -- 'uptime', 'api', 'database', 'storage', 'dns', 'broken_link', 'console_error'
  status VARCHAR(50) NOT NULL, -- 'pass', 'fail', 'warning'
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_control_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL, -- 'cache_clear', 'rebuild', 'restart', 'rollback', 'deploy', 'migrate', 'qa_scan', 'gap_scan', 'course_generate', 'env_update', 'pr_create'
  target_service VARCHAR(255),
  parameters JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  triggered_by UUID REFERENCES auth.users(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result JSONB,
  error_message TEXT,
  requires_approval BOOLEAN DEFAULT false,
  approval_status VARCHAR(50), -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES auth.users(id),
  approval_reason TEXT,
  ip_address INET
);

CREATE TABLE IF NOT EXISTS platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  integration_name VARCHAR(255) NOT NULL,
  integration_type VARCHAR(100) NOT NULL, -- 'github', 'cloudflare', 'supabase', 'openai', 'anthropic', 'gemini', 'stripe', 'sendgrid', etc.
  provider VARCHAR(100),
  status VARCHAR(50) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'testing'
  config JSONB DEFAULT '{}', -- Non-sensitive config
  credentials_env_var VARCHAR(255), -- Name of env var containing credentials
  is_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'deployment', 'migration', 'config_change', 'user_action', 'system_event', 'error', 'security'
  event_category VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'info', -- 'debug', 'info', 'warn', 'error', 'critical'
  title VARCHAR(500),
  description TEXT,
  actor_id UUID REFERENCES auth.users(id),
  actor_role VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  incident_type VARCHAR(100) NOT NULL, -- 'outage', 'degradation', 'security', 'data', 'configuration'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low', 'info'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  affected_services JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'investigating', -- 'investigating', 'identified', 'monitoring', 'resolved'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  identified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  root_cause TEXT,
  remediation TEXT,
  impact_assessment TEXT,
  notification_sent BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_release_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  release_type VARCHAR(50) NOT NULL, -- 'major', 'minor', 'patch', 'hotfix'
  environment VARCHAR(50) DEFAULT 'production',
  status VARCHAR(50) DEFAULT 'deployed', -- 'draft', 'testing', 'deployed', 'rolled_back', 'failed'
  changelog TEXT,
  deployed_by UUID REFERENCES auth.users(id),
  deployed_at TIMESTAMPTZ,
  rollback_at TIMESTAMPTZ,
  previous_version VARCHAR(50),
  commit_hash VARCHAR(64),
  branch VARCHAR(255),
  build_url VARCHAR(500),
  deployment_url VARCHAR(500),
  pre_deployment_checks JSONB DEFAULT '[]',
  post_deployment_checks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_env_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  env_var_name VARCHAR(255) NOT NULL,
  description TEXT,
  var_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'url', 'key'
  is_sensitive BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false, -- System vars cannot be changed
  allowed_environments JSONB DEFAULT '["production", "staging", "development"]',
  default_value TEXT,
  current_value TEXT,
  validation_rules JSONB DEFAULT '{}',
  related_service_id UUID REFERENCES platform_services(id),
  last_modified_by UUID REFERENCES auth.users(id),
  last_modified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_services_tenant ON platform_services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_services_type ON platform_services(service_type);
CREATE INDEX IF NOT EXISTS idx_platform_services_status ON platform_services(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_service ON platform_health_checks(service_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_time ON platform_health_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_control_actions_status ON platform_control_actions(status);
CREATE INDEX IF NOT EXISTS idx_control_actions_type ON platform_control_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_tenant ON platform_event_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_type ON platform_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_time ON platform_event_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON platform_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON platform_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_release_history_env ON platform_release_history(environment);
CREATE INDEX IF NOT EXISTS idx_release_history_time ON platform_release_history(deployed_at);
CREATE INDEX IF NOT EXISTS idx_env_registry_tenant ON platform_env_registry(tenant_id);

-- Row Level Security
ALTER TABLE platform_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_control_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_release_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_env_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY platform_services_tenant ON platform_services FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_health_tenant ON platform_health_checks FOR ALL USING (service_id IN (SELECT id FROM platform_services WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY platform_control_tenant ON platform_control_actions FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_integrations_tenant ON platform_integrations FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_events_tenant ON platform_event_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_incidents_tenant ON platform_incidents FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_releases_tenant ON platform_release_history FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_env_tenant ON platform_env_registry FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Seed default platform services
INSERT INTO platform_services (service_name, service_type, url, provider, environment, status, owner_role) VALUES
  ('Elevate Website', 'website', 'https://www.elevateforhumanity.org', 'northflank', 'production', 'healthy', 'platform_owner'),
  ('LMS Portal', 'lms', 'https://www.elevateforhumanity.org/lms', 'northflank', 'production', 'healthy', 'platform_owner'),
  ('Admin Portal', 'admin', 'https://www.elevateforhumanity.org/admin', 'northflank', 'production', 'healthy', 'platform_admin'),
  ('Student Portal', 'lms', 'https://www.elevateforhumanity.org/student', 'northflank', 'production', 'healthy', 'platform_owner'),
  ('Employer Portal', 'website', 'https://www.elevateforhumanity.org/employer', 'northflank', 'production', 'healthy', 'platform_owner'),
  ('API Routes', 'api', 'https://www.elevateforhumanity.org/api', 'northflank', 'production', 'healthy', 'platform_owner'),
  ('Supabase Database', 'database', 'https://supabase.com/dashboard', 'supabase', 'production', 'healthy', 'platform_admin'),
  ('Cloudflare CDN', 'cdn', 'https://dash.cloudflare.com', 'cloudflare', 'production', 'healthy', 'platform_owner'),
  ('Cloudflare R2 Storage', 'storage', 'https://dash.cloudflare.com/r2', 'cloudflare', 'production', 'healthy', 'platform_owner'),
  ('GitHub Repository', 'deployment', 'https://github.com/elevate-for-humanity/Elevate-lms', 'github', 'production', 'healthy', 'platform_owner')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE platform_services IS 'Registry of all platform services and their health status';
COMMENT ON TABLE platform_health_checks IS 'Historical health check results';
COMMENT ON TABLE platform_control_actions IS 'Control actions performed on the platform';
COMMENT ON TABLE platform_integrations IS 'Third-party integrations and their status';
COMMENT ON TABLE platform_event_logs IS 'Comprehensive event audit trail';
COMMENT ON TABLE platform_incidents IS 'Platform incidents and outages';
COMMENT ON TABLE platform_release_history IS 'Deployment and release history';
COMMENT ON TABLE platform_env_registry IS 'Environment variable registry and management';