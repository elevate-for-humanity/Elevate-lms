-- Add pending_funding and pending_admin_review to applications.status CHECK constraint.
--
-- The /api/applications route inserts these values for funded applicants
-- (WIOA / WRG / FSSA). Without them the insert fails with a CHECK violation,
-- surfacing as "Failed to submit application" on the HVAC and other apply pages.
--
-- pending_funding      → funded applicant who has not yet been to Indiana Career Connect
-- pending_admin_review → funded applicant with ICC in process, awaiting staff review

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check,
  DROP CONSTRAINT IF EXISTS applications_valid_status;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (status = ANY (ARRAY[
    'submitted',
    'pending_funding',
    'pending_admin_review',
    'pending_workone',
    'funding_review',
    'scheduled',
    'in_review',
    'under_review',
    'attended_orientation',
    'ready_to_enroll',
    'approved',
    'rejected',
    'enrolled',
    'active_apprentice',
    'assigned',
    'completed',
    'placed',
    'retained',
    'waitlisted',
    'withdrawn',
    'exited'
  ]::text[]));
