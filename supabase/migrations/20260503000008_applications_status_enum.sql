-- Enforce valid status values on applications table.
-- Existing rows with non-conforming statuses (e.g. 'onboarding_complete', 'pending')
-- are migrated to the nearest valid state before the constraint is added.

-- Migrate legacy statuses
UPDATE public.applications SET status = 'submitted'  WHERE status = 'pending';
UPDATE public.applications SET status = 'enrolled'   WHERE status IN ('onboarding_complete', 'converted');

-- Add constraint (idempotent)
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_valid_status;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_valid_status CHECK (
    status IN ('submitted', 'in_review', 'approved', 'rejected', 'enrolled', 'pending_workone', 'waitlisted')
  );
