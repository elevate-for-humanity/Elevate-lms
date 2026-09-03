-- Automation trigger system.
-- Defines rules that fire when conditions are met, enqueue actions into
-- automation_action_queue, and track execution history.
--
-- Trigger types:
--   stale_lead          → email reminder to assigned staff / reassign
--   compliance_alert    → escalate to super_admin after threshold
--   job_failure         → retry job or notify on-call
--   enrollment_overdue  → nudge applicant + notify admin
--   inactive_learner    → outreach email to learner
--
-- Execution: /api/admin/automations/run (called by job_queue or cron)

-- ── automation_rules ─────────────────────────────────────────────────────────
-- Defines what triggers what action under what condition.
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  description     text,
  trigger_type    text        NOT NULL,
    -- 'stale_lead' | 'compliance_alert' | 'job_failure'
    -- | 'enrollment_overdue' | 'inactive_learner'
  condition_json  jsonb       NOT NULL DEFAULT '{}',
    -- e.g. {"days_threshold": 5, "severity": "critical"}
  action_type     text        NOT NULL,
    -- 'send_email' | 'create_task' | 'reassign' | 'retry_job' | 'escalate'
  action_config   jsonb       NOT NULL DEFAULT '{}',
    -- e.g. {"template": "stale_lead_reminder", "to_role": "staff"}
  enabled         boolean     NOT NULL DEFAULT true,
  cooldown_hours  integer     NOT NULL DEFAULT 24,
    -- Minimum hours between firings for the same reference_id
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- NOTE: automation_rules already existed in the DB with a different schema.
-- The table uses trigger_config (not condition_json) and status (not enabled).
-- Migration applied the following ALTER to add missing columns:
--   ALTER TABLE public.automation_rules
--     ADD COLUMN IF NOT EXISTS condition_json jsonb NOT NULL DEFAULT '{}',
--     ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true,
--     ADD COLUMN IF NOT EXISTS cooldown_hours integer NOT NULL DEFAULT 24;

-- Seed default rules (uses both trigger_config and condition_json for compatibility)
INSERT INTO public.automation_rules
  (name, description, trigger_type, trigger_config, condition_json, action_type, action_config, cooldown_hours, enabled)
VALUES
  ('Stale lead reminder', 'Email assigned staff when a lead has no activity for 5+ days.',
   'stale_lead', '{"days_threshold": 5}', '{"days_threshold": 5}',
   'send_email', '{"template": "stale_lead_reminder", "to_role": "staff"}', 24, true),
  ('Critical compliance escalation', 'Escalate unresolved critical compliance alerts to super_admin after 24 hours.',
   'compliance_alert', '{"severity": "critical", "hours_threshold": 24}', '{"severity": "critical", "hours_threshold": 24}',
   'escalate', '{"to_role": "super_admin", "template": "compliance_escalation"}', 24, true),
  ('High compliance escalation', 'Escalate unresolved high-severity compliance alerts to admin after 72 hours.',
   'compliance_alert', '{"severity": "high", "hours_threshold": 72}', '{"severity": "high", "hours_threshold": 72}',
   'escalate', '{"to_role": "admin", "template": "compliance_escalation"}', 48, true),
  ('Failed job retry', 'Retry failed jobs up to 3 times with exponential backoff.',
   'job_failure', '{"max_attempts": 3}', '{"max_attempts": 3}',
   'retry_job', '{"backoff_minutes": [5, 15, 60]}', 1, true),
  ('Enrollment overdue nudge', 'Email applicant when their enrollment review has been pending 72+ hours.',
   'enrollment_overdue', '{"hours_threshold": 72}', '{"hours_threshold": 72}',
   'send_email', '{"template": "enrollment_pending_nudge", "to": "applicant"}', 48, true),
  ('Inactive learner outreach', 'Email learner when they have been inactive for 7+ days.',
   'inactive_learner', '{"days_threshold": 7}', '{"days_threshold": 7}',
   'send_email', '{"template": "learner_reengagement", "to": "learner"}', 72, true)
ON CONFLICT DO NOTHING;

-- ── automation_action_queue ───────────────────────────────────────────────────
-- Pending and completed automation actions.
CREATE TABLE IF NOT EXISTS public.automation_action_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         uuid        NOT NULL REFERENCES public.automation_rules(id),
  reference_id    uuid        NOT NULL,   -- source row that triggered the rule
  reference_table text        NOT NULL,
  action_type     text        NOT NULL,
  action_config   jsonb       NOT NULL DEFAULT '{}',
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','processing','completed','failed','skipped')),
  attempts        integer     NOT NULL DEFAULT 0,
  last_error      text,
  scheduled_at    timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aaq_status_scheduled
  ON public.automation_action_queue (status, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_aaq_rule_reference
  ON public.automation_action_queue (rule_id, reference_id);

-- ── automation_execution_log ──────────────────────────────────────────────────
-- Immutable audit trail of every automation action taken.
CREATE TABLE IF NOT EXISTS public.automation_execution_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id       uuid        NOT NULL REFERENCES public.automation_action_queue(id),
  rule_id         uuid        NOT NULL REFERENCES public.automation_rules(id),
  reference_id    uuid        NOT NULL,
  reference_table text        NOT NULL,
  action_type     text        NOT NULL,
  outcome         text        NOT NULL CHECK (outcome IN ('success','failure','skipped')),
  detail          jsonb,
  executed_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Cooldown check ────────────────────────────────────────────────────────────
-- Returns true if the rule has already fired for this reference_id within cooldown.
CREATE OR REPLACE FUNCTION public.automation_in_cooldown(
  p_rule_id      uuid,
  p_reference_id uuid
) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.automation_action_queue q
    JOIN public.automation_rules r ON r.id = q.rule_id
    WHERE q.rule_id      = p_rule_id
      AND q.reference_id = p_reference_id
      AND q.status IN ('pending','processing','completed')
      AND q.created_at > now() - (r.cooldown_hours || ' hours')::interval
  );
$$;

-- ── Enqueue automation actions from priority queue ────────────────────────────
-- Called by /api/admin/automations/run or a scheduled job.
CREATE OR REPLACE FUNCTION public.enqueue_automation_actions()
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  enqueued integer := 0;
  rec      record;
BEGIN
  FOR rec IN
    SELECT
      r.id          AS rule_id,
      r.action_type,
      r.action_config,
      r.trigger_type,
      r.condition_json,
      q.reference_id,
      q.reference_table,
      q.days_overdue,
      q.severity,
      q.priority_score
    FROM public.admin_priority_queue q
    JOIN public.automation_rules r ON r.trigger_type = q.item_type
    WHERE q.resolved = false
      AND r.enabled  = true
      -- Apply condition thresholds
      AND (
        (r.trigger_type = 'stale_lead'
          AND q.days_overdue >= (r.condition_json->>'days_threshold')::integer)
        OR
        (r.trigger_type = 'compliance_alert'
          AND (r.condition_json->>'severity' IS NULL OR q.severity = r.condition_json->>'severity')
          AND q.days_overdue * 24 >= (r.condition_json->>'hours_threshold')::integer)
        OR
        (r.trigger_type = 'job_failure')
        OR
        (r.trigger_type = 'enrollment_overdue'
          AND q.days_overdue * 24 >= (r.condition_json->>'hours_threshold')::integer)
        OR
        (r.trigger_type = 'inactive_learner'
          AND q.days_overdue >= (r.condition_json->>'days_threshold')::integer)
      )
  LOOP
    -- Skip if in cooldown
    IF public.automation_in_cooldown(rec.rule_id, rec.reference_id) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.automation_action_queue
      (rule_id, reference_id, reference_table, action_type, action_config)
    VALUES
      (rec.rule_id, rec.reference_id, rec.reference_table, rec.action_type, rec.action_config);

    enqueued := enqueued + 1;
  END LOOP;

  RETURN enqueued;
END;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.automation_rules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_action_queue   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_execution_log  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_automation_rules" ON public.automation_rules;
DO $$ BEGIN CREATE POLICY "admin_manage_automation_rules" ON public.automation_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "admin_read_action_queue" ON public.automation_action_queue;
DO $$ BEGIN CREATE POLICY "admin_read_action_queue" ON public.automation_action_queue FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "admin_write_action_queue" ON public.automation_action_queue;
DO $$ BEGIN CREATE POLICY "admin_write_action_queue" ON public.automation_action_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "admin_read_execution_log" ON public.automation_execution_log;
DO $$ BEGIN CREATE POLICY "admin_read_execution_log" ON public.automation_execution_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
