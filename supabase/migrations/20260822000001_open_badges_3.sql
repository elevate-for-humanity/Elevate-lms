-- Open Badges 3.0 credential metadata and issuance storage
-- Extends the canonical credentials / learner_credentials registry.

ALTER TABLE credentials
  ADD COLUMN IF NOT EXISTS open_badges_version TEXT DEFAULT '3.0',
  ADD COLUMN IF NOT EXISTS achievement_type TEXT DEFAULT 'Certificate',
  ADD COLUMN IF NOT EXISTS achievement_criteria_narrative TEXT,
  ADD COLUMN IF NOT EXISTS achievement_criteria_url TEXT,
  ADD COLUMN IF NOT EXISTS badge_image_url TEXT,
  ADD COLUMN IF NOT EXISTS alignment JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE learner_credentials
  ADD COLUMN IF NOT EXISTS open_badge_credential JSONB,
  ADD COLUMN IF NOT EXISTS open_badge_credential_url TEXT,
  ADD COLUMN IF NOT EXISTS open_badge_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_badge_proof_type TEXT,
  ADD COLUMN IF NOT EXISTS recipient_identity_hash TEXT,
  ADD COLUMN IF NOT EXISTS open_badge_status TEXT NOT NULL DEFAULT 'not_issued';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'learner_credentials_open_badge_status_check'
  ) THEN
    ALTER TABLE learner_credentials
      ADD CONSTRAINT learner_credentials_open_badge_status_check
      CHECK (open_badge_status IN ('not_issued', 'pending', 'issued', 'revoked', 'expired', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lc_open_badge_status
  ON learner_credentials(open_badge_status);

CREATE INDEX IF NOT EXISTS idx_lc_recipient_identity_hash
  ON learner_credentials(recipient_identity_hash)
  WHERE recipient_identity_hash IS NOT NULL;

COMMENT ON COLUMN credentials.open_badges_version IS
  'Open Badges specification version used when this credential is issued natively by Elevate.';
COMMENT ON COLUMN learner_credentials.open_badge_credential IS
  'Signed OpenBadgeCredential JSON-LD document for this learner award.';
COMMENT ON COLUMN learner_credentials.open_badge_credential_url IS
  'Stable public URL where the issued OpenBadgeCredential can be retrieved.';
