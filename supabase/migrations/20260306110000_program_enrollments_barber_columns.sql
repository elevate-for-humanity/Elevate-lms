-- Adds columns needed to link public (unauthenticated) barber checkout
-- enrollments back to a user once they create an account.
--
-- Skipped: payment_status, stripe_session_id, email, full_name, phone,
--          amount_paid_cents, funding_source, enrollment_state, enrolled_at
--          (all already exist from prior migrations or original CREATE TABLE)

ALTER TABLE program_enrollments
  ADD COLUMN IF NOT EXISTS program_slug        TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id  TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS barber_sub_id       UUID;

-- Index for email-based lookup (used when linking account post-signup)
CREATE INDEX IF NOT EXISTS idx_program_enrollments_email
  ON program_enrollments (email);
