-- Reconcile production drift: the canonical credential registry originally
-- defined this flag, but some production histories predate that column.

ALTER TABLE credentials
  ADD COLUMN IF NOT EXISTS open_badges_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_credentials_open_badges_enabled
  ON credentials(open_badges_enabled)
  WHERE open_badges_enabled = true;

COMMENT ON COLUMN credentials.open_badges_enabled IS
  'Explicit opt-in for native Elevate Open Badges 3.0 issuance. External credentials must remain false.';
