-- Notification outbox lifecycle hardening:
-- 1. Add 'processing' status to prevent double-pickup during concurrent cron runs
-- 2. Add 'dead_letter' flag for permanently failed notifications that need manual review
-- 3. Add processed_at timestamp for observability

-- Add 'processing' to the enum
ALTER TYPE notification_status ADD VALUE IF NOT EXISTS 'processing' BEFORE 'sent';

-- Add dead_letter flag and processed_at
ALTER TABLE notification_outbox
  ADD COLUMN IF NOT EXISTS dead_letter BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Index for dead letter monitoring
CREATE INDEX IF NOT EXISTS idx_notification_outbox_dead_letter
  ON notification_outbox (dead_letter, created_at DESC)
  WHERE dead_letter = TRUE;

COMMENT ON COLUMN notification_outbox.dead_letter IS 'True when max_attempts exhausted. Requires manual review.';
COMMENT ON COLUMN notification_outbox.processed_at IS 'When the processor last touched this row (claimed for processing).';
