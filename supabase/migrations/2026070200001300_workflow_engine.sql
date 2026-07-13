-- Workflow Engine: triggers, steps, runs
-- Extends the existing `workflows` table with full trigger→action pipeline support.

-- ── workflow_triggers ─────────────────────────────────────────────────────────
-- Defines what fires a workflow (event-based, schedule, or manual).
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_type  text NOT NULL CHECK (trigger_type IN (
    'event',        -- platform_events row matches filter
    'schedule',     -- cron expression
    'manual',       -- admin fires it manually
    'webhook'       -- inbound HTTP POST
  )),
  -- For event triggers: match on event_type / category / severity
  event_filter  jsonb DEFAULT '{}',
  -- For schedule triggers: cron expression e.g. "0 9 * * *"
  cron_expr     text,
  -- For webhook triggers: shared secret for HMAC verification
  webhook_secret text,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── workflow_steps ────────────────────────────────────────────────────────────
-- Ordered list of actions that execute when a workflow fires.
CREATE TABLE IF NOT EXISTS workflow_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order    integer NOT NULL DEFAULT 0,
  action_type   text NOT NULL CHECK (action_type IN (
    'send_email',       -- trigger email via delivery_logs / SendGrid
    'send_notification',-- insert into notifications
    'update_record',    -- UPDATE a table row
    'create_record',    -- INSERT a table row
    'emit_event',       -- write to platform_events
    'webhook_call',     -- outbound HTTP POST
    'ai_action',        -- call AI service
    'condition'         -- branch: if/else on payload field
  )),
  action_config jsonb NOT NULL DEFAULT '{}',
  -- condition step: skip remaining steps if false
  is_condition  boolean NOT NULL DEFAULT false,
  condition_expr text,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── workflow_runs ─────────────────────────────────────────────────────────────
-- Execution log: one row per workflow invocation.
CREATE TABLE IF NOT EXISTS workflow_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_id    uuid REFERENCES workflow_triggers(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'success', 'failed', 'skipped'
  )),
  triggered_by  text,           -- 'event', 'schedule', 'manual', 'webhook'
  trigger_payload jsonb DEFAULT '{}',
  steps_total   integer NOT NULL DEFAULT 0,
  steps_done    integer NOT NULL DEFAULT 0,
  error_message text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── workflow_step_logs ────────────────────────────────────────────────────────
-- Per-step execution detail within a run.
CREATE TABLE IF NOT EXISTS workflow_step_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_id       uuid REFERENCES workflow_steps(id) ON DELETE SET NULL,
  step_order    integer NOT NULL DEFAULT 0,
  action_type   text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'success', 'failed', 'skipped'
  )),
  output        jsonb DEFAULT '{}',
  error_message text,
  duration_ms   integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow    ON workflow_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow     ON workflow_runs(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status       ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_step_logs_run     ON workflow_step_logs(run_id, step_order);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE workflow_triggers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access (service role bypasses RLS)
CREATE POLICY "admin_all_workflow_triggers"  ON workflow_triggers  FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
);
CREATE POLICY "admin_all_workflow_steps"     ON workflow_steps     FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
);
CREATE POLICY "admin_all_workflow_runs"      ON workflow_runs      FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
);
CREATE POLICY "admin_all_workflow_step_logs" ON workflow_step_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
);

-- ── Seed a few example workflows ──────────────────────────────────────────────
INSERT INTO workflows (name, workflow_key, category, status, metadata) VALUES
  ('Enrollment Welcome Email',  'enrollment_welcome',   'enrollment',  'active',   '{"description":"Sends welcome email when student enrolls in a program"}'),
  ('At-Risk Student Alert',     'at_risk_alert',        'lms',         'active',   '{"description":"Notifies staff when a student has not logged in for 7 days"}'),
  ('Exam Booking Confirmation', 'exam_booking_confirm', 'compliance',  'active',   '{"description":"Sends confirmation email after exam booking is created"}'),
  ('Daily Progress Summary',    'daily_summary',        'system',      'active',   '{"description":"Sends end-of-day progress digest to instructors"}'),
  ('Certificate Issued Alert',  'cert_issued',          'lms',         'active',   '{"description":"Notifies student and staff when a certificate is issued"}')
ON CONFLICT DO NOTHING;
