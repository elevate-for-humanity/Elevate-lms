-- webhook_retry_log: audit trail for Stripe webhook retry/skip events.
-- Referenced by /api/webhooks/stripe but never created in a prior migration.
-- Missing table caused 500s on any idempotency or duplicate-detection path,
-- which caused Stripe to disable the endpoint after 9 days of failed delivery.

CREATE TABLE IF NOT EXISTS public.webhook_retry_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text        NOT NULL,
  event_id      text        NOT NULL,
  event_type    text        NOT NULL,
  outcome       text        NOT NULL,  -- 'duplicate_skipped' | 'idempotency_failed' | 'record_failed'
  metadata      jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_retry_log_event_id
  ON public.webhook_retry_log (event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_retry_log_provider_created
  ON public.webhook_retry_log (provider, created_at DESC);

-- Service role only — no user-facing reads needed
ALTER TABLE public.webhook_retry_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.webhook_retry_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
