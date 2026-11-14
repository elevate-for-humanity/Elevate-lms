-- Migration: Create QA Auto-Healing Agent tables
-- Purpose: Store QA scan results, issues, fixes, and verification

CREATE TABLE IF NOT EXISTS qa_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  scan_type VARCHAR(100) NOT NULL, -- 'full', 'incremental', 'scheduled', 'post_deploy', 'manual'
  scope VARCHAR(100) DEFAULT 'all', -- 'all', 'frontend', 'backend', 'database', 'accessibility', 'seo'
  triggered_by VARCHAR(100), -- 'cron', 'deploy', 'pr', 'manual', 'webhook'
  trigger_details JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  high_issues INTEGER DEFAULT 0,
  medium_issues INTEGER DEFAULT 0,
  low_issues INTEGER DEFAULT 0,
  auto_fixed INTEGER DEFAULT 0,
  manual_fix_required INTEGER DEFAULT 0,
  results JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES qa_scans(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  issue_type VARCHAR(100) NOT NULL, -- 'build_error', 'runtime_error', 'broken_link', 'console_error', 'hydration_error', 'accessibility', 'seo', 'api_failure', 'auth_issue', 'missing_asset', 'type_error', 'lint_error', 'schema_error'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low', 'info'
  category VARCHAR(100), -- 'typescript', 'eslint', 'link', 'api', 'accessibility', 'seo', 'security'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  error_message TEXT,
  stack_trace TEXT,
  affected_url VARCHAR(1000),
  affected_file VARCHAR(1000),
  line_number INTEGER,
  column_number INTEGER,
  suggested_fix TEXT,
  auto_fixable BOOLEAN DEFAULT false,
  fix_status VARCHAR(50) DEFAULT 'open', -- 'open', 'auto_fixed', 'manual_fix_required', 'fixed', 'ignored', 'verified'
  fix_id UUID, -- Reference to qa_fixes
  verification_status VARCHAR(50), -- 'pending', 'passed', 'failed'
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  assignee_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS qa_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES qa_scans(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES qa_issues(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  fix_type VARCHAR(50) NOT NULL, -- 'auto', 'manual', 'template'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'rejected', 'applied', 'rolled_back'
  original_code TEXT,
  fixed_code TEXT,
  file_path VARCHAR(1000),
  line_start INTEGER,
  line_end INTEGER,
  diff TEXT,
  approval_required BOOLEAN DEFAULT false,
  approval_reason VARCHAR(100), -- 'delete_file', 'auth_change', 'schema_change', 'payment_change', 'env_change', 'production_deploy'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id),
  verification_run_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_verification_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES qa_scans(id) ON DELETE CASCADE,
  fix_id UUID REFERENCES qa_fixes(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  verification_type VARCHAR(50) NOT NULL, -- 'typecheck', 'lint', 'build', 'test', 'smoke_test', 'crawl', 'api_check', 'accessibility_scan'
  command VARCHAR(500),
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'passed', 'failed', 'skipped'
  output TEXT,
  error_output TEXT,
  exit_code INTEGER,
  duration_ms INTEGER,
  tests_passed INTEGER,
  tests_failed INTEGER,
  issues_found JSONB DEFAULT '[]',
  screenshots JSONB DEFAULT '[]', -- Array of screenshot URLs for browser tests
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS qa_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES qa_scans(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  log_type VARCHAR(50) NOT NULL, -- 'scan_error', 'fix_error', 'verification_error', 'deployment_error', 'command_error'
  level VARCHAR(20) DEFAULT 'error', -- 'debug', 'info', 'warn', 'error'
  message TEXT,
  details JSONB DEFAULT '{}',
  stack_trace TEXT,
  affected_file VARCHAR(1000),
  command_executed TEXT,
  files_changed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_crawl_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES qa_scans(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  page_url VARCHAR(1000) NOT NULL,
  page_title VARCHAR(500),
  role_scope VARCHAR(50), -- 'public', 'admin', 'student', 'employer', 'instructor'
  status_code INTEGER,
  console_errors JSONB DEFAULT '[]',
  failed_requests JSONB DEFAULT '[]',
  hydration_errors JSONB DEFAULT '[]',
  screenshot_url VARCHAR(1000),
  performance_metrics JSONB DEFAULT '{}',
  accessibility_violations JSONB DEFAULT '[]',
  seo_issues JSONB DEFAULT '[]',
  links_found JSONB DEFAULT '[]',
  broken_links JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qa_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  scan_type VARCHAR(100) NOT NULL,
  cron_expression VARCHAR(100), -- '0 2 * * *' for 2 AM daily
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  on_deploy BOOLEAN DEFAULT false,
  on_pr_merge BOOLEAN DEFAULT false,
  scope VARCHAR(100) DEFAULT 'all',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_scans_tenant ON qa_scans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qa_scans_status ON qa_scans(status);
CREATE INDEX IF NOT EXISTS idx_qa_scans_triggered ON qa_scans(triggered_by);
CREATE INDEX IF NOT EXISTS idx_qa_issues_scan ON qa_issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_qa_issues_type ON qa_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_qa_issues_severity ON qa_issues(severity);
CREATE INDEX IF NOT EXISTS idx_qa_issues_status ON qa_issues(fix_status);
CREATE INDEX IF NOT EXISTS idx_qa_issues_file ON qa_issues(affected_file);
CREATE INDEX IF NOT EXISTS idx_qa_fixes_issue ON qa_fixes(issue_id);
CREATE INDEX IF NOT EXISTS idx_qa_fixes_status ON qa_fixes(status);
CREATE INDEX IF NOT EXISTS idx_qa_verification_scan ON qa_verification_runs(scan_id);
CREATE INDEX IF NOT EXISTS idx_qa_verification_status ON qa_verification_runs(status);
CREATE INDEX IF NOT EXISTS idx_qa_error_logs_scan ON qa_error_logs(scan_id);
CREATE INDEX IF NOT EXISTS idx_qa_error_logs_type ON qa_error_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_qa_crawl_scan ON qa_crawl_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_qa_crawl_url ON qa_crawl_results(page_url);

-- Row Level Security
ALTER TABLE qa_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_fixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_verification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_crawl_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY qa_scans_tenant ON qa_scans FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY qa_issues_tenant ON qa_issues FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY qa_fixes_tenant ON qa_fixes FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY qa_verification_tenant ON qa_verification_runs FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY qa_error_logs_tenant ON qa_error_logs FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY qa_crawl_tenant ON qa_crawl_results FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY qa_schedule_tenant ON qa_schedule FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Auto-fix rules table
CREATE TABLE IF NOT EXISTS qa_auto_fix_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  issue_pattern VARCHAR(500) NOT NULL, -- Regex pattern to match issue
  issue_type VARCHAR(100) NOT NULL,
  fix_template TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT false,
  approval_reason VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default auto-fix rules
INSERT INTO qa_auto_fix_rules (issue_pattern, issue_type, fix_template, requires_approval, priority) VALUES
  ('unused.*import', 'lint_error', 'Remove unused import', false, 10),
  ('missing.*alt.*text', 'accessibility', 'Add alt text placeholder', false, 20),
  ('missing.*loading', 'component', 'Add loading state', false, 15),
  ('missing.*error.*boundary', 'component', 'Add error boundary', false, 15),
  ('hydration.*mismatch', 'hydration_error', 'Add suppressHydrationWarning or use client directive', false, 25),
  ('undefined.*null.*check', 'runtime_error', 'Add null check', false, 30),
  ('404.*link.*broken', 'broken_link', 'Fix or remove broken link', false, 20),
  ('missing.*metadata', 'seo', 'Add page metadata', false, 10),
  ('TypeScript.*import.*error', 'type_error', 'Fix import path', false, 25),
  ('unused.*variable', 'lint_error', 'Remove unused variable', false, 10)
ON CONFLICT DO NOTHING;

-- Seed approval-required rules
INSERT INTO qa_auto_fix_rules (issue_pattern, issue_type, fix_template, requires_approval, approval_reason, priority) VALUES
  ('auth.*guard', 'auth_issue', 'Requires admin review of auth changes', true, 'auth_change', 50),
  ('role.*permission', 'auth_issue', 'Requires admin review of RBAC changes', true, 'auth_change', 50),
  ('database.*schema', 'schema_error', 'Requires admin approval for schema changes', true, 'schema_change', 100),
  ('environment.*variable', 'env_error', 'Requires admin approval for env changes', true, 'env_change', 100),
  ('delete.*file', 'file_operation', 'File deletion requires approval', true, 'delete_file', 80)
ON CONFLICT DO NOTHING;

ALTER TABLE qa_auto_fix_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_auto_fix_rules_tenant ON qa_auto_fix_rules FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

COMMENT ON TABLE qa_scans IS 'QA scan history and summary';
COMMENT ON TABLE qa_issues IS 'Individual issues found during scans';
COMMENT ON TABLE qa_fixes IS 'Proposed and applied fixes for issues';
COMMENT ON TABLE qa_verification_runs IS 'Verification test results';
COMMENT ON TABLE qa_error_logs IS 'Error logs from scan/fix operations';
COMMENT ON TABLE qa_crawl_results IS 'Browser crawl results including console errors';
COMMENT ON TABLE qa_schedule IS 'Scheduled QA scan configurations';
COMMENT ON TABLE qa_auto_fix_rules IS 'Rules for auto-fixing common issues';