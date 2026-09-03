-- Dev Studio Full OS tables
-- Idempotent: safe to re-run

-- AI Agents
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'idle',
  capabilities jsonb DEFAULT '[]'::jsonb,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AI Tasks
CREATE TABLE IF NOT EXISTS ai_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  requires_approval boolean NOT NULL DEFAULT false,
  approval_reason text,
  plan jsonb DEFAULT '[]'::jsonb,
  result jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AI Task Steps
CREATE TABLE IF NOT EXISTS ai_task_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_order int NOT NULL DEFAULT 0,
  action text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  output text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Task Logs
CREATE TABLE IF NOT EXISTS ai_task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES ai_tasks(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE SET NULL,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Memory
CREATE TABLE IF NOT EXISTS ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'general',
  key text NOT NULL,
  value text NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AI Code Patterns
CREATE TABLE IF NOT EXISTS ai_code_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  pattern text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  usage_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Repo Index
CREATE TABLE IF NOT EXISTS ai_repo_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  file_type text,
  summary text,
  last_indexed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI File Snapshots
CREATE TABLE IF NOT EXISTS ai_file_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  content text NOT NULL,
  version int NOT NULL DEFAULT 1,
  task_id uuid REFERENCES ai_tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Diffs
CREATE TABLE IF NOT EXISTS ai_diffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES ai_tasks(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  diff_content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Approvals
CREATE TABLE IF NOT EXISTS ai_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  requested_by uuid,
  approved_by uuid,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Deployments
CREATE TABLE IF NOT EXISTS ai_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  environment text NOT NULL DEFAULT 'production',
  status text NOT NULL DEFAULT 'pending',
  commit_sha text,
  build_log text,
  health_check jsonb,
  triggered_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Dev Container Sessions
CREATE TABLE IF NOT EXISTS dev_container_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  status text NOT NULL DEFAULT 'active',
  container_id text,
  config jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  stopped_at timestamptz
);

-- Dev Terminal Logs
CREATE TABLE IF NOT EXISTS dev_terminal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES dev_container_sessions(id) ON DELETE CASCADE,
  command text NOT NULL,
  output text,
  exit_code int,
  executed_at timestamptz NOT NULL DEFAULT now()
);

-- Dev Audit Logs
CREATE TABLE IF NOT EXISTS dev_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
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

-- Admin/super_admin policies
DO $$ BEGIN
  -- ai_agents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_agents_admin_all') THEN
    CREATE POLICY ai_agents_admin_all ON ai_agents FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_tasks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_tasks_admin_all') THEN
    CREATE POLICY ai_tasks_admin_all ON ai_tasks FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_task_steps
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_task_steps_admin_all') THEN
    CREATE POLICY ai_task_steps_admin_all ON ai_task_steps FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_task_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_task_logs_admin_all') THEN
    CREATE POLICY ai_task_logs_admin_all ON ai_task_logs FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_memory
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_memory_admin_all') THEN
    CREATE POLICY ai_memory_admin_all ON ai_memory FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_code_patterns
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_code_patterns_admin_all') THEN
    CREATE POLICY ai_code_patterns_admin_all ON ai_code_patterns FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_repo_index
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_repo_index_admin_all') THEN
    CREATE POLICY ai_repo_index_admin_all ON ai_repo_index FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_file_snapshots
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_file_snapshots_admin_all') THEN
    CREATE POLICY ai_file_snapshots_admin_all ON ai_file_snapshots FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_diffs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_diffs_admin_all') THEN
    CREATE POLICY ai_diffs_admin_all ON ai_diffs FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_approvals
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_approvals_admin_all') THEN
    CREATE POLICY ai_approvals_admin_all ON ai_approvals FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- ai_deployments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_deployments_admin_all') THEN
    CREATE POLICY ai_deployments_admin_all ON ai_deployments FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- dev_container_sessions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dev_container_sessions_admin_all') THEN
    CREATE POLICY dev_container_sessions_admin_all ON dev_container_sessions FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- dev_terminal_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dev_terminal_logs_admin_all') THEN
    CREATE POLICY dev_terminal_logs_admin_all ON dev_terminal_logs FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
  -- dev_audit_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dev_audit_logs_admin_all') THEN
    CREATE POLICY dev_audit_logs_admin_all ON dev_audit_logs FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))
    );
  END IF;
END $$;

-- Seed 10 AI agents
INSERT INTO ai_agents (name, role, status, capabilities) VALUES
  ('AI Developer', 'developer', 'idle', '["code_generation","refactoring","debugging"]'::jsonb),
  ('AI Debugger', 'debugger', 'idle', '["error_analysis","stack_trace","fix_suggestion"]'::jsonb),
  ('AI Architect', 'architect', 'idle', '["system_design","schema_planning","api_design"]'::jsonb),
  ('AI QA Tester', 'qa_tester', 'idle', '["test_generation","regression_testing","smoke_testing"]'::jsonb),
  ('AI DevOps Engineer', 'devops', 'idle', '["deployment","monitoring","infrastructure"]'::jsonb),
  ('AI LMS Builder', 'lms_builder', 'idle', '["course_generation","curriculum_design","content_creation"]'::jsonb),
  ('AI Workflow Builder', 'workflow_builder', 'idle', '["automation","cron_jobs","event_triggers"]'::jsonb),
  ('AI Website Manager', 'website_manager', 'idle', '["seo","content_updates","performance_optimization"]'::jsonb),
  ('AI Compliance Assistant', 'compliance', 'idle', '["wioa_reporting","audit_preparation","policy_enforcement"]'::jsonb),
  ('AI Business Operations Manager', 'business_ops', 'idle', '["analytics","reporting","process_optimization"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Seed core coding patterns
INSERT INTO ai_code_patterns (name, description, pattern, category) VALUES
  ('Auth Guards', 'Role-based access control pattern', 'await requireRole([''admin'', ''super_admin'']);', 'security'),
  ('DevStudio API Guards', 'Platform operator API auth', 'const auth = await apiRequireDevStudio(req); if (auth.error) return auth.error;', 'security'),
  ('Supabase Admin Client', 'Service-role database access', 'const db = await requireAdminClient();', 'database'),
  ('Tenant ID Scoping', 'Multi-tenant query isolation', '.eq(''tenant_id'', tenantId)', 'database'),
  ('Trace ID Propagation', 'Request tracing across services', 'const traceId = req.headers.get(''x-trace-id'') ?? crypto.randomUUID();', 'observability'),
  ('Logger Error Handling', 'Structured error logging', 'logger.error(''[context] message'', { error, traceId });', 'observability'),
  ('Workflow Execution', 'Async workflow step pattern', 'await executeWorkflowStep(step, context);', 'automation'),
  ('LMS Course Generation', 'Blueprint-driven course creation', 'await buildCanonicalCourseFromBlueprint(blueprint, programId);', 'lms')
ON CONFLICT DO NOTHING;
