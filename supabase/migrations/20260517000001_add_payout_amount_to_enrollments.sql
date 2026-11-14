-- Add payout_amount to program_enrollments.
-- Referenced by the payout queue UI and v_cdl_enrollment_control view
-- but was never added to the table.

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(10, 2);

COMMENT ON COLUMN public.program_enrollments.payout_amount IS
  'Dollar amount owed to the program holder / contractor for this enrollment. Set manually or via the payout queue.';
