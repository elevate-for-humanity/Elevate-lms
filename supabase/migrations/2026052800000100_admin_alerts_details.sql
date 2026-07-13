-- Add details JSONB and resolved boolean to admin_alerts.
-- details stores operational context: apprentice_id, site_id, distance_m,
-- shift_id, hours, payment_id, violation metadata — used by AI, escalation,
-- and analytics. resolved is a fast boolean index for unresolved alert queries.

ALTER TABLE admin_alerts
  ADD COLUMN IF NOT EXISTS details   JSONB    DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS resolved  BOOLEAN  NOT NULL DEFAULT false;

-- Backfill resolved from resolved_at (existing rows)
UPDATE admin_alerts SET resolved = true WHERE resolved_at IS NOT NULL;

-- Index for the common query: unresolved alerts by type
CREATE INDEX IF NOT EXISTS idx_admin_alerts_unresolved
  ON admin_alerts (alert_type, created_at DESC)
  WHERE resolved = false;

COMMENT ON COLUMN admin_alerts.details IS
  'Operational context for the alert. Keys vary by alert_type:
   geofence_violation: {apprentice_id, site_id, distance_m, lat, lng}
   overtime_warning:   {apprentice_id, shift_id, hours_elapsed}
   missing_clock_out:  {apprentice_id, shift_id, clock_in_at}
   payment_failure:    {user_id, subscription_id, payment_intent_id}
   low_hours_pace:     {apprentice_id, ojl_logged, ojl_required, weeks_remaining, pace_deficit}';
