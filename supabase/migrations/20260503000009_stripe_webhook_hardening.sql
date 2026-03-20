-- Stripe webhook hardening.
--
-- Fixes two issues that caused Stripe to disable the webhook endpoint:
--
-- 1. stripe_webhook_events was missing payload and metadata columns.
--    The handler inserts both on every event; the missing columns caused
--    every insert to fail, so idempotency records were never written.
--
-- 2. webhook_retry_log did not exist. The handler writes to it on
--    duplicate/skip paths. Without the table those writes threw errors
--    that could propagate to a 500 response.
--    (webhook_retry_log is also created in 20260503000008 — this ALTER
--    is a no-op if that migration ran first.)

-- Add missing columns to stripe_webhook_events
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS payload  jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- webhook_retry_log (idempotent — safe to run even if 20260503000008 already applied)
CREATE TABLE IF NOT EXISTS public.webhook_retry_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    text        NOT NULL,
  event_id    text        NOT NULL,
  event_type  text        NOT NULL,
  outcome     text        NOT NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_retry_log_event_id
  ON public.webhook_retry_log (event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_retry_log_provider_created
  ON public.webhook_retry_log (provider, created_at DESC);

ALTER TABLE public.webhook_retry_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'webhook_retry_log'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON public.webhook_retry_log
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
