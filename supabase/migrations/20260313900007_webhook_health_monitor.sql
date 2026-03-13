-- Webhook health monitor schema changes.
-- Standardizes webhook_events_processed as the canonical tracking table
-- with explicit status lifecycle: received → validated → processed | errored.

-- Add received_at and error_message columns
ALTER TABLE webhook_events_processed
  ADD COLUMN IF NOT EXISTS received_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS error_message text;

-- Change default status from 'processed' to 'received'
ALTER TABLE webhook_events_processed
  ALTER COLUMN status SET DEFAULT 'received';

-- Update status constraint to include full lifecycle
ALTER TABLE webhook_events_processed
  DROP CONSTRAINT IF EXISTS webhook_events_processed_status_check;
ALTER TABLE webhook_events_processed
  ADD CONSTRAINT webhook_events_processed_status_check
  CHECK (status IN ('received', 'validated', 'processing', 'processed', 'failed', 'skipped', 'errored'));

-- Provider constraint — all 6 active providers
ALTER TABLE webhook_events_processed
  DROP CONSTRAINT IF EXISTS webhook_events_processed_provider_check;
ALTER TABLE webhook_events_processed
  ADD CONSTRAINT webhook_events_processed_provider_check
  CHECK (provider IN ('stripe', 'sezzle', 'affirm', 'jotform', 'calendly', 'resend'));

-- Index for health monitor volume queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_received
  ON webhook_events_processed (provider, received_at DESC);

-- Replace overly strict immutability triggers with lifecycle guard.
-- Allows valid forward transitions only:
--   received → validated → processing → processed
--   received|validated|processing → errored
-- Blocks DELETE and backward transitions.
DROP TRIGGER IF EXISTS trg_prevent_wep_delete ON webhook_events_processed;
DROP TRIGGER IF EXISTS trg_prevent_wep_update ON webhook_events_processed;
DROP TRIGGER IF EXISTS enforce_webhook_event_immutability ON webhook_events_processed;

CREATE OR REPLACE FUNCTION webhook_event_lifecycle_guard()
RETURNS TRIGGER AS $fn$
DECLARE
  valid_transitions text[][] := ARRAY[
    ['received','validated'],
    ['received','processing'],
    ['received','processed'],
    ['received','errored'],
    ['received','skipped'],
    ['validated','processing'],
    ['validated','processed'],
    ['validated','errored'],
    ['processing','processed'],
    ['processing','errored'],
    ['processing','failed']
  ];
  transition text[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'webhook_events_processed is append-only. DELETE blocked.';
  END IF;

  FOREACH transition SLICE 1 IN ARRAY valid_transitions LOOP
    IF OLD.status = transition[1] AND NEW.status = transition[2] THEN
      RETURN NEW;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'Invalid status transition: % -> %', OLD.status, NEW.status;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_webhook_event_lifecycle ON webhook_events_processed;
CREATE TRIGGER trg_webhook_event_lifecycle
  BEFORE UPDATE OR DELETE ON webhook_events_processed
  FOR EACH ROW
  EXECUTE FUNCTION webhook_event_lifecycle_guard();
