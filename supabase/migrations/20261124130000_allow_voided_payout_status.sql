-- Allow payout_status 'voided' so an admin can cancel a queued partner payout
-- (e.g. already paid outside the queue, or raised with no approved schedule).
-- The original CHECK in 20260616000003_enrollment_payout_enforcement.sql only
-- allowed ('not_triggered','pending','due','overdue','paid'), so writing
-- 'voided' from the void-payout API route would fail without this change.
-- The constraint was created inline, so Postgres auto-named it
-- program_enrollments_payout_status_check.
ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS program_enrollments_payout_status_check;
ALTER TABLE public.program_enrollments
  ADD CONSTRAINT program_enrollments_payout_status_check
    CHECK (payout_status IN ('not_triggered','pending','due','overdue','paid','voided'));
