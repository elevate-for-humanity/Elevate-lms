-- Add action_type and description columns to audit_logs.
--
-- These columns are written by lib/monitoring/error-tracker.ts for structured
-- monitoring events (error, api_request, rate_limit_hit, security_event) and
-- queried by the monitoring API routes.
--
-- Both columns are nullable so existing rows and triggers are unaffected.

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS action_type  text,
  ADD COLUMN IF NOT EXISTS description  text;

-- Index for the monitoring queries that filter by action_type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type
  ON public.audit_logs (action_type, created_at DESC)
  WHERE action_type IS NOT NULL;

-- Post-apply verification:
--
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'audit_logs'
--     AND column_name IN ('action_type', 'description')
--   ORDER BY column_name;
--
--   Expected: 2 rows, both character varying / text, YES nullable.
