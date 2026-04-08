-- Voucher payment tracking timestamps for program_enrollments.
-- These three fields are required to enforce the MOU payment clause:
-- payout triggers on voucher_paid_date, not enrollment or completion.
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS student_start_date   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voucher_issued_date   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voucher_paid_date     TIMESTAMPTZ;

COMMENT ON COLUMN public.program_enrollments.student_start_date  IS 'Date student attended and participated beyond initial enrollment — triggers voucher invoicing';
COMMENT ON COLUMN public.program_enrollments.voucher_issued_date IS 'Date WorkOne or funding agency issued the voucher';
COMMENT ON COLUMN public.program_enrollments.voucher_paid_date   IS 'Date Elevate received funds from the voucher — triggers 10-day payout clock to program holder';
