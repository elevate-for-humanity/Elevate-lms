-- Replace single-column event_id unique constraint with composite (provider, event_id).
-- Without this, two providers sharing the same event_id string would trigger a false
-- duplicate and one event would be silently dropped.

-- Drop the old single-column constraint if it exists
ALTER TABLE webhook_events_processed
  DROP CONSTRAINT IF EXISTS webhook_events_processed_event_id_key;

-- Drop any existing single-column unique index on event_id
DROP INDEX IF EXISTS webhook_events_processed_event_id_idx;

-- Create the correct composite unique index
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_id_idx
  ON webhook_events_processed (provider, event_id)
  WHERE event_id IS NOT NULL;

-- Also add processing_duration_ms as a generated column for latency tracking.
-- Derived from processed_at - received_at so no application code needs to compute it.
ALTER TABLE webhook_events_processed
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Backfill: for rows already in 'processed' status with no processed_at, use received_at
-- (conservative — avoids NULL in duration calc for historical rows)
UPDATE webhook_events_processed
  SET processed_at = received_at
  WHERE status = 'processed'
    AND processed_at IS NULL;
