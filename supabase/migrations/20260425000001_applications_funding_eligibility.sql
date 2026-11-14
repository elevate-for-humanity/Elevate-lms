-- Add funding eligibility tracking columns to applications table.
--
-- funding_type: wioa | wrg | fssa | self-pay | employer | unsure
-- funding_eligibility_status: approved | in_process | needs_appointment | not_resident
--   'needs_appointment' = student has not been to Indiana Career Connect yet
--   These applications are saved as status='pending_funding' and must NOT be enrolled
--   until the student completes ICC and reapplies.
--
-- Also adds 'pending_funding' and 'pending_admin_review' to the status check constraint.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS funding_type text,
  ADD COLUMN IF NOT EXISTS funding_eligibility_status text;

-- Extend the status check constraint to include the two new funded statuses.
-- Drop and recreate since Postgres does not support ALTER CHECK inline.
DO $$
BEGIN
  -- Remove old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND constraint_name = 'applications_status_check'
  ) THEN
    ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
  END IF;
END $$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (
    status IN (
      'submitted',
      'pending_funding',       -- funded, has not been to ICC yet — do not enroll
      'pending_admin_review',  -- funded, ICC in process or approved — admin must verify
      'under_review',
      'approved',
      'enrolled',
      'waitlisted',
      'rejected',
      'withdrawn',
      'incomplete'
    )
  );

-- Index for admin dashboard queries filtering by funded status
CREATE INDEX IF NOT EXISTS idx_applications_funding_type
  ON public.applications (funding_type)
  WHERE funding_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_pending_funding
  ON public.applications (status)
  WHERE status IN ('pending_funding', 'pending_admin_review');

COMMENT ON COLUMN public.applications.funding_type IS
  'Funding source selected by applicant: wioa | wrg | fssa | self-pay | employer | unsure';

COMMENT ON COLUMN public.applications.funding_eligibility_status IS
  'Result of FundingEligibilityFlow: approved | in_process | needs_appointment | not_resident';
