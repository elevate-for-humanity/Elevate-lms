-- CDL enrollment tracking columns
-- Adds training dates and provider notification audit trail.
-- provider_notified_at proves Elevate recorded the student before provider contact.

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS training_start_date   date,
  ADD COLUMN IF NOT EXISTS training_end_date     date,
  ADD COLUMN IF NOT EXISTS provider_notified_at  timestamptz,
  ADD COLUMN IF NOT EXISTS provider_notified_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.program_enrollments.provider_notified_at IS
  'Timestamp when Elevate notified the training provider. Always set AFTER enrollment is recorded here — proves Elevate owns the student record.';

COMMENT ON COLUMN public.program_enrollments.provider_notified_by IS
  'Admin user who triggered provider notification.';
