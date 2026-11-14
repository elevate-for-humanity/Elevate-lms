-- Extend enrollment_state CHECK constraint to include placement and follow-up states.
-- Add follow-up tracking columns to applications table.
-- These states are required for WIOA performance reporting and DOL outcome tracking.

-- 1. Drop and recreate the enrollment_state CHECK constraint with full state set
ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS program_enrollments_enrollment_state_check;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT program_enrollments_enrollment_state_check
  CHECK (enrollment_state IS NULL OR enrollment_state = ANY (ARRAY[
    'applied',
    'waitlisted',
    'onboarding',
    'orientation',
    'enrolled',
    'active',
    'pending_funding_verification',
    'payment_required',
    'suspended',
    'revoked',
    'withdrawn',
    'completed',
    'graduated',
    'placed',
    'follow_up_6mo',
    'follow_up_12mo'
  ]));

-- 2. Add follow-up timestamp columns to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS follow_up_6mo_at  timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_12mo_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_6mo_employed  boolean,
  ADD COLUMN IF NOT EXISTS follow_up_12mo_employed boolean,
  ADD COLUMN IF NOT EXISTS follow_up_6mo_wage      numeric(8,2),
  ADD COLUMN IF NOT EXISTS follow_up_12mo_wage     numeric(8,2),
  ADD COLUMN IF NOT EXISTS follow_up_notes         text;

-- 3. Index for follow-up reporting queries
CREATE INDEX IF NOT EXISTS applications_follow_up_6mo_idx  ON public.applications (follow_up_6mo_at)  WHERE follow_up_6mo_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS applications_follow_up_12mo_idx ON public.applications (follow_up_12mo_at) WHERE follow_up_12mo_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS program_enrollments_state_idx   ON public.program_enrollments (enrollment_state);

COMMENT ON COLUMN public.applications.follow_up_6mo_at       IS '6-month post-placement follow-up date — required for WIOA entered employment retention metric';
COMMENT ON COLUMN public.applications.follow_up_12mo_at      IS '12-month post-placement follow-up date — required for WIOA second quarter retention metric';
COMMENT ON COLUMN public.applications.follow_up_6mo_employed IS 'Still employed at 6-month follow-up';
COMMENT ON COLUMN public.applications.follow_up_12mo_employed IS 'Still employed at 12-month follow-up';
