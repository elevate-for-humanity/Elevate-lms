-- Webhook event deduplication and forensic replay traceability.
-- Every webhook from Stripe, Sezzle, and Affirm is logged here
-- before processing. Prevents duplicate processing and provides
-- an audit trail for exactly-once verification.

CREATE TABLE IF NOT EXISTS public.webhook_events_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'sezzle', 'affirm')),
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'skipped', 'errored')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
  UNIQUE (provider, event_id)
);

-- Index for lookup during idempotency checks
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event
  ON public.webhook_events_processed (provider, event_id);

-- Index for monitoring/reconciliation queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events_processed (status, received_at DESC);

-- Immutability: processed webhook events should not be modified or deleted
CREATE OR REPLACE FUNCTION prevent_webhook_event_tampering()
RETURNS TRIGGER AS $t$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'IMMUTABLE: webhook event records cannot be deleted. event_id: %', OLD.event_id;
  END IF;
  -- Allow status transitions: processing → processed/skipped/errored only
  IF TG_OP = 'UPDATE' AND OLD.status != 'processing' THEN
    RAISE EXCEPTION 'IMMUTABLE: webhook event already finalized. event_id: %, status: %', OLD.event_id, OLD.status;
  END IF;
  RETURN NEW;
END;
$t$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_webhook_event_immutability ON public.webhook_events_processed;
CREATE TRIGGER enforce_webhook_event_immutability
  BEFORE UPDATE OR DELETE ON public.webhook_events_processed
  FOR EACH ROW
  EXECUTE FUNCTION prevent_webhook_event_tampering();

-- RLS: only service_role can insert/read
ALTER TABLE public.webhook_events_processed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.webhook_events_processed
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE public.webhook_events_processed IS 
  'Append-only log of all processed webhook events. Used for idempotency, replay protection, and audit forensics.';
