-- The chk_voucher_date_sequence constraint was added directly in the DB
-- (not via a migration). Its current definition blocks setting
-- voucher_issued_date on rows where payout_status was previously set to
-- 'pending' by the trigger, creating a chicken-and-egg deadlock.
--
-- This migration drops the unknown constraint and recreates it with the
-- correct rule: if voucher_paid_date is set, voucher_issued_date must also
-- be set and must be <= voucher_paid_date.

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS chk_voucher_date_sequence;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT chk_voucher_date_sequence CHECK (
    voucher_paid_date IS NULL
    OR (
      voucher_issued_date IS NOT NULL
      AND voucher_issued_date <= voucher_paid_date
    )
  );
