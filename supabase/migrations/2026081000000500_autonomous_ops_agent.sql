-- Migration: Create Autonomous Operations Agent tables
-- Purpose: Platform-wide issue detection and auto-fix

CREATE TABLE IF NOT EXISTS platform_ops_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  scan_type VARCHAR(100) NOT NULL, -- 'all', 'enrollment', 'payment', 'payroll', 'login', 'onboarding', 'website', 'document'
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed'
  total_issues INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS platform_ops_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES platform_ops_scans(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'website', 'enrollment', 'onboarding', 'payment', 'document', 'payroll', 'login', 'runtime'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  affected_record VARCHAR(255),
  affected_table VARCHAR(255),
  suggested_fix TEXT,
  auto_fixable BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  fix_status VARCHAR(50) DEFAULT 'open', -- 'open', 'auto_fixed', 'manual_fix_required', 'fixed', 'ignored'
  fixed_at TIMESTAMPTZ,
  fixed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_ops_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES platform_ops_issues(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  fix_type VARCHAR(50) NOT NULL, -- 'auto', 'manual', 'approved'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'applied', 'failed'
  fix_action TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_ops_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type VARCHAR(100) NOT NULL, -- 'scan_run', 'fix_applied', 'fix_approved', 'fix_rejected'
  scan_id UUID REFERENCES platform_ops_scans(id),
  issue_id UUID REFERENCES platform_ops_issues(id),
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_provisioning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  enrollment_id UUID,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  provisioned_at TIMESTAMPTZ,
  error_message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollment_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL,
  check_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pass', 'fail', 'warning'
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  enrollment_id UUID,
  task_type VARCHAR(100) NOT NULL, -- 'welcome_email', 'document_request', 'profile_setup', 'course_assignment'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'skipped'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  document_type VARCHAR(100) NOT NULL, -- 'id', 'enrollment_agreement', 'funding_approval', 'attendance_agreement'
  status VARCHAR(50) DEFAULT 'pending', -- 'present', 'missing', 'expired'
  expiry_date DATE,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL,
  check_type VARCHAR(100) NOT NULL, -- 'payment_record', 'funding_source', 'bnpl_status'
  status VARCHAR(50) DEFAULT 'pending', -- 'pass', 'fail', 'warning'
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  hour_entry_id UUID,
  user_id UUID REFERENCES auth.users(id),
  check_type VARCHAR(100) NOT NULL, -- 'payroll_record', 'pay_rate', 'timesheet'
  status VARCHAR(50) DEFAULT 'pending', -- 'pass', 'fail', 'warning'
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_asset_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  asset_type VARCHAR(100) NOT NULL, -- 'image', 'hero', 'banner', 'logo'
  asset_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending', -- 'present', 'missing', 'broken'
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_provisioning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  dashboard_type VARCHAR(100) NOT NULL, -- 'student', 'employer', 'instructor', 'admin'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'created', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email_type VARCHAR(100) NOT NULL, -- 'welcome', 'password_reset', 'enrollment_confirmation', 'document_request'
  status VARCHAR(50) DEFAULT 'pending', -- 'sent', 'delivered', 'failed', 'bounced'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ops_scans_tenant ON platform_ops_scans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ops_scans_status ON platform_ops_scans(status);
CREATE INDEX IF NOT EXISTS idx_ops_issues_scan ON platform_ops_issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_ops_issues_category ON platform_ops_issues(category);
CREATE INDEX IF NOT EXISTS idx_ops_issues_severity ON platform_ops_issues(severity);
CREATE INDEX IF NOT EXISTS idx_ops_issues_status ON platform_ops_issues(fix_status);
CREATE INDEX IF NOT EXISTS idx_student_provisioning_user ON student_provisioning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_user ON onboarding_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_checks_user ON document_compliance_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_checks_enrollment ON payment_health_checks(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_delivery_logs(user_id);

-- Row Level Security
ALTER TABLE platform_ops_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ops_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ops_fixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ops_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_provisioning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_asset_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_provisioning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY platform_ops_scans_tenant ON platform_ops_scans FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_ops_issues_tenant ON platform_ops_issues FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_ops_fixes_tenant ON platform_ops_fixes FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY platform_ops_audit_tenant ON platform_ops_audit_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY student_provisioning_tenant ON student_provisioning_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY enrollment_health_tenant ON enrollment_health_checks FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY onboarding_tenant ON onboarding_tasks FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY document_compliance_tenant ON document_compliance_checks FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY payment_health_tenant ON payment_health_checks FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY payroll_health_tenant ON payroll_health_checks FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY website_asset_tenant ON website_asset_checks FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY dashboard_provisioning_tenant ON dashboard_provisioning_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY email_delivery_tenant ON email_delivery_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

COMMENT ON TABLE platform_ops_scans IS 'Operations scan history and results';
COMMENT ON TABLE platform_ops_issues IS 'Issues detected by operations scanners';
COMMENT ON TABLE platform_ops_fixes IS 'Fixes applied or pending for issues';
COMMENT ON TABLE student_provisioning_logs IS 'Student dashboard provisioning audit trail';
COMMENT ON TABLE enrollment_health_checks IS 'Enrollment health check results';
COMMENT ON TABLE onboarding_tasks IS 'Student onboarding task tracking';
COMMENT ON TABLE document_compliance_checks IS 'Document compliance verification';
COMMENT ON TABLE payment_health_checks IS 'Payment health verification';
COMMENT ON TABLE payroll_health_checks IS 'Payroll health verification';
COMMENT ON TABLE website_asset_checks IS 'Website asset integrity checks';
COMMENT ON TABLE dashboard_provisioning_logs IS 'Dashboard creation audit trail';
COMMENT ON TABLE email_delivery_logs IS 'Email delivery tracking';