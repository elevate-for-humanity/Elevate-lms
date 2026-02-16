-- Email Workflows Table (Drip Campaigns)
CREATE TABLE IF NOT EXISTS email_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('enrollment', 'application', 'completion', 'abandoned')),
  target_audience TEXT NOT NULL,
  steps JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Workflow Enrollments Table (Tracks users in workflows)
CREATE TABLE IF NOT EXISTS workflow_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES email_workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  next_email_at TIMESTAMPTZ,
  last_email_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_status ON email_workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON email_workflows(trigger_event);
CREATE INDEX IF NOT EXISTS idx_enrollments_workflow ON workflow_enrollments(workflow_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON workflow_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_next_email ON workflow_enrollments(next_email_at) WHERE completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_enrollments_completed ON workflow_enrollments(completed);

-- Unique constraint: one enrollment per user per workflow
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique ON workflow_enrollments(workflow_id, user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON email_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflows_updated_at();

-- RLS Policies
ALTER TABLE email_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_enrollments ENABLE ROW LEVEL SECURITY;

-- Admin can manage workflows
CREATE POLICY "Admins can manage workflows" ON email_workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin can view enrollments
CREATE POLICY "Admins can view enrollments" ON workflow_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE email_workflows IS 'Automated email workflows (drip campaigns)';
COMMENT ON TABLE workflow_enrollments IS 'Tracks users enrolled in workflows';
COMMENT ON COLUMN email_workflows.trigger_event IS 'Event that triggers workflow: enrollment, application, completion, abandoned';
COMMENT ON COLUMN email_workflows.steps IS 'Array of email steps with delay, template, subject, html';
COMMENT ON COLUMN workflow_enrollments.current_step IS 'Current step index in workflow (0-based)';
COMMENT ON COLUMN workflow_enrollments.next_email_at IS 'When to send next email in sequence';
