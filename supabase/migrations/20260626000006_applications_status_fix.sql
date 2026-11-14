-- Restore pending_funding and pending_admin_review to applications.status CHECK constraint.
--
-- These values were added in 20260425000001 but dropped by 20260430000010 and
-- 20260503000008. The /api/applications route inserts both values for funded
-- applicants (WIOA/WRG/FSSA), causing a CHECK violation and the user-visible
-- "Failed to save application" error on the HVAC apply page.
--
-- Full canonical status set after this migration:
--   submitted            → initial submission (self-pay / employer / unsure)
--   pending_funding      → funded applicant who has not yet been to ICC
--   pending_admin_review → funded applicant with ICC in process — awaiting staff review
--   pending_workone      → awaiting WorkOne eligibility confirmation
--   scheduled            → consultation booked
--   in_review            → staff reviewing
--   under_review         → alias used by some admin routes
--   attended_orientation → orientation complete
--   ready_to_enroll      → cleared for enrollment
--   approved             → approved for enrollment
--   rejected             → application rejected
--   enrolled             → actively enrolled
--   active_apprentice    → in apprenticeship program
--   assigned             → placed with employer/shop
--   completed            → program complete
--   placed               → employed post-completion
--   retained             → retained at 2nd quarter (WIOA metric)
--   waitlisted           → on waitlist
--   withdrawn            → voluntarily left
--   exited               → formally exited (WIOA exit)
--   funding_review       → funding verification in progress (legacy)

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_valid_status,
  DROP CONSTRAINT IF EXISTS applications_status_check;

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
