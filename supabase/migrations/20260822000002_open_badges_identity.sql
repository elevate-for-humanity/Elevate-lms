-- Open Badges 3.0 recipient identity binding
-- Stores the random salt used to create the standards-compatible IdentityObject hash.

ALTER TABLE learner_credentials
  ADD COLUMN IF NOT EXISTS recipient_identity_salt TEXT,
  ADD COLUMN IF NOT EXISTS recipient_identity_type TEXT DEFAULT 'email';

COMMENT ON COLUMN learner_credentials.recipient_identity_salt IS
  'Random salt concatenated with the normalized recipient identifier before SHA-256 hashing for the Open Badges IdentityObject.';
COMMENT ON COLUMN learner_credentials.recipient_identity_type IS
  'Open Badges recipient identity type; currently email for Elevate native issuance.';
