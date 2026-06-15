-- Migration: Create AI Agent tables for Dev Studio
-- Purpose: Store AI agent configurations, tasks, audit logs, and memory

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  model_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'gemini', 'deepseek', 'qwen'
  model_name VARCHAR(255) NOT NULL,
  system_prompt TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(500),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'planning', 'executing', 'completed', 'failed', 'cancelled', 'requires_approval'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  result JSONB,
  error TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'chat', 'plan', 'execute', 'shell', 'git', 'file_read', 'file_write', 'file_delete', 'deploy', 'approve'
  prompt TEXT,
  response TEXT,
  files_changed JSONB DEFAULT '[]',
  shell_commands JSONB DEFAULT '[]',
  git_branch VARCHAR(255),
  status VARCHAR(50) DEFAULT 'success', -- 'success', 'failed', 'pending'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_id UUID REFERENCES ai_task_steps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  prompt TEXT,
  response TEXT,
  files_changed JSONB DEFAULT '[]',
  shell_commands JSONB DEFAULT '[]',
  git_branch VARCHAR(255),
  status VARCHAR(50) DEFAULT 'success',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type VARCHAR(50) NOT NULL, -- 'conversation', 'code_context', 'task_history', 'pattern'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  relevance_score DECIMAL(3,2),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_code_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pattern_name VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(100), -- 'component', 'api', 'migration', 'test', 'workflow'
  code_snippet TEXT,
  description TEXT,
  use_cases JSONB DEFAULT '[]',
  language VARCHAR(50),
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_repo_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  file_hash VARCHAR(64),
  content_summary TEXT,
  code_symbols JSONB DEFAULT '[]',
  last_indexed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_file_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  diff_content TEXT,
  old_hash VARCHAR(64),
  new_hash VARCHAR(64),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'applied'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_id UUID REFERENCES ai_task_steps(id) ON DELETE CASCADE,
  approval_type VARCHAR(100) NOT NULL, -- 'file_delete', 'migration', 'main_push', 'production_deploy', 'env_change'
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  environment VARCHAR(50) NOT NULL, -- 'development', 'staging', 'production'
  branch VARCHAR(255) NOT NULL,
  commit_hash VARCHAR(64),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'building', 'deploying', 'success', 'failed', 'rolled_back'
  build_log TEXT,
  deploy_log TEXT,
  url VARCHAR(500),
  deployed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dev_container_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  container_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'stopped', 'terminated'
  resources JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dev_terminal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dev_container_sessions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  command TEXT,
  output TEXT,
  exit_code INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_category VARCHAR(100) NOT NULL, -- 'ai_agent', 'file_operation', 'shell_command', 'git_operation', 'deployment'
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_tenant_status ON ai_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user ON ai_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_steps_task ON ai_task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_logs_task ON ai_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_logs_user ON ai_task_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_type ON ai_memory(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_code_patterns_type ON ai_code_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_approvals_status ON ai_approvals(status);
CREATE INDEX IF NOT EXISTS idx_ai_deployments_tenant ON ai_deployments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_user ON dev_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_created ON dev_audit_logs(created_at);

-- Row Level Security
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_code_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_repo_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_file_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_container_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_terminal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their tenant's data
CREATE POLICY ai_agents_tenant ON ai_agents FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_tasks_tenant ON ai_tasks FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_task_steps_tenant ON ai_task_steps FOR ALL USING (task_id IN (SELECT id FROM ai_tasks WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY ai_task_logs_tenant ON ai_task_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_memory_tenant ON ai_memory FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_code_patterns_tenant ON ai_code_patterns FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_repo_index_tenant ON ai_repo_index FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_file_snapshots_tenant ON ai_file_snapshots FOR ALL USING (task_id IN (SELECT id FROM ai_tasks WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY ai_diffs_tenant ON ai_diffs FOR ALL USING (task_id IN (SELECT id FROM ai_tasks WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY ai_approvals_tenant ON ai_approvals FOR ALL USING (task_id IN (SELECT id FROM ai_tasks WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY ai_deployments_tenant ON ai_deployments FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY dev_container_sessions_tenant ON dev_container_sessions FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY dev_terminal_logs_tenant ON dev_terminal_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY dev_audit_logs_tenant ON dev_audit_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

COMMENT ON TABLE ai_agents IS 'AI agent configurations for Dev Studio';
COMMENT ON TABLE ai_tasks IS 'AI task tracking and status';
COMMENT ON TABLE ai_task_steps IS 'Individual steps within AI tasks';
COMMENT ON TABLE ai_task_logs IS 'Audit logs for all AI agent actions';
COMMENT ON TABLE ai_memory IS 'Persistent memory for AI agents';
COMMENT ON TABLE ai_code_patterns IS 'Reusable code patterns learned by AI';
COMMENT ON TABLE ai_repo_index IS 'Indexed repository files for AI context';
COMMENT ON TABLE ai_file_snapshots IS 'File snapshots before/after changes';
COMMENT ON TABLE ai_diffs IS 'Git diffs pending approval';
COMMENT ON TABLE ai_approvals IS 'Approval requests for sensitive operations';
COMMENT ON TABLE ai_deployments IS 'AI-triggered deployments tracking';
COMMENT ON TABLE dev_container_sessions IS 'Dev container session tracking';
COMMENT ON TABLE dev_terminal_logs IS 'Terminal command logs';
COMMENT ON TABLE dev_audit_logs IS 'Comprehensive audit trail';