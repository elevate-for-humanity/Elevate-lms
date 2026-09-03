-- Extend applications.status CHECK constraint to include post-enrollment
-- lifecycle states required for WIOA performance reporting (ETA-9173).
--
-- New states:
--   scheduled            → consultation booked
--   attended_orientation → orientation complete
--   active_apprentice    → actively in program
--   assigned             → placed with employer/shop
--   completed            → program complete
--   placed               → employed post-completion
--   retained             → retained at 2nd quarter (WIOA metric)
--   withdrawn            → voluntarily left
--   exited               → formally exited (WIOA exit)

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (status = ANY (ARRAY[
    'submitted',
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
    'withdrawn',
    'exited',
    'pending_workone',
    'waitlisted'
  ]::text[]));
