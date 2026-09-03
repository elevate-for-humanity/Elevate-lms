-- Add escalation_level and details to admin_alerts.
-- escalation_level tracks L1→L2→L3 progression so the escalation cron
-- can detect unacknowledged alerts and escalate them automatically.
-- details stores structured context (deficit, hours, etc.) for display.
-- Idempotent — safe to re-run.

ALTER TABLE public.admin_alerts
  ADD COLUMN IF NOT EXISTS escalation_level  integer NOT NULL DEFAULT 1
    CHECK (escalation_level BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS escalated_at      timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_at   timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS details           jsonb DEFAULT '{}';

-- Index for the escalation cron: find unresolved, unacknowledged alerts by level
CREATE INDEX IF NOT EXISTS admin_alerts_escalation_idx
  ON public.admin_alerts (escalation_level, created_at)
  WHERE resolved_at IS NULL AND acknowledged_at IS NULL;

COMMENT ON COLUMN public.admin_alerts.escalation_level IS
  '1=initial alert, 2=escalated to supervisor, 3=escalated to admin/director';
COMMENT ON COLUMN public.admin_alerts.details IS
  'Structured context: deficit, hours, threshold, etc. Used by Mission Control widgets.';
