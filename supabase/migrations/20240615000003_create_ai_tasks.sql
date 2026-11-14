-- Create ai_tasks table for Open Studio workflows
-- Stores automated task execution pipelines

CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  task_type TEXT DEFAULT 'general',
  agent_config JSONB DEFAULT '{}',
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user ON ai_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_created ON ai_tasks(created_at DESC);

-- RLS
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;

-- Admins can see all tasks, users can only see their own
CREATE POLICY "Admins can view all tasks" ON ai_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can insert tasks" ON ai_tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can update tasks" ON ai_tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can delete tasks" ON ai_tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_tasks_updated_at
  BEFORE UPDATE ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_tasks_updated_at();

COMMENT ON TABLE ai_tasks IS 'AI task execution pipelines for Open Studio - tracks workflow status, results, and agent configurations';