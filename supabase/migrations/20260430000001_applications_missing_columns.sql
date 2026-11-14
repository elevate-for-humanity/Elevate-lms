-- Add columns written by the student application form (eligibility update pass)
-- and the FSSA application form that were missing from the applications table.
-- Also widens the status CHECK constraint to include values used by the admin
-- transition route (ready_to_enroll, enrolled, in_review).

ALTER TABLE public.applications
  -- Student form eligibility update
  ADD COLUMN IF NOT EXISTS funding_status           text,
  ADD COLUMN IF NOT EXISTS readiness_status         text,
  ADD COLUMN IF NOT EXISTS support_needs_transport  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_needs_other      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS case_manager_name        text,
  ADD COLUMN IF NOT EXISTS case_manager_email       text,
  ADD COLUMN IF NOT EXISTS referral_source          text,
  -- FSSA form
  ADD COLUMN IF NOT EXISTS funding_source           text,
  ADD COLUMN IF NOT EXISTS application_type         text,
  ADD COLUMN IF NOT EXISTS metadata                 jsonb;

-- Widen status constraint to cover all values used by admin transition route.
-- Previous constraint (from 20260401000010) did not include enrolled/ready_to_enroll/in_review.
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'submitted',
    'pending_workone',
    'funding_review',
    'in_review',
    'under_review',
    'ready_to_enroll',
    'approved',
    'enrolled',
    'rejected',
    'withdrawn'
  ));

-- Indexes for admin queue filtering
CREATE INDEX IF NOT EXISTS idx_applications_funding_status
  ON public.applications (funding_status)
  WHERE funding_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_application_type
  ON public.applications (application_type)
  WHERE application_type IS NOT NULL;
