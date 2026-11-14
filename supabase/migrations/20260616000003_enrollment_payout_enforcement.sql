-- Payout enforcement layer for program_enrollments.
-- Implements the MOU Section 4 operational controls:
--   - payout_due_date auto-calculated as voucher_paid_date + 14 calendar days (≈10 business days)
--   - payout_status machine-managed: not_triggered → pending → due/overdue → paid
--   - voucher_paid_date blocked unless voucher_issued_date exists (DB-enforced)
--   - Full audit trail in enrollment_voucher_audit

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS payout_status    TEXT NOT NULL DEFAULT 'not_triggered'
    CHECK (payout_status IN ('not_triggered','pending','due','overdue','paid')),
  ADD COLUMN IF NOT EXISTS payout_due_date  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_paid_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_paid_by   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS payout_notes     TEXT;

-- Audit log: one row per field change, who changed it, when
CREATE TABLE IF NOT EXISTS public.enrollment_voucher_audit (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID        NOT NULL REFERENCES public.program_enrollments(id) ON DELETE CASCADE,
  changed_by    UUID        NOT NULL REFERENCES auth.users(id),
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  field_name    TEXT        NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  note          TEXT
);

CREATE INDEX IF NOT EXISTS idx_enrollment_voucher_audit_enrollment
  ON public.enrollment_voucher_audit(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_voucher_audit_changed_at
  ON public.enrollment_voucher_audit(changed_at DESC);

-- Trigger: auto-set payout_due_date and payout_status when voucher_paid_date is entered.
-- Blocks voucher_paid_date if voucher_issued_date is missing.
CREATE OR REPLACE FUNCTION public.fn_enrollment_voucher_payout()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.voucher_paid_date IS NOT NULL AND OLD.voucher_paid_date IS NULL THEN
    IF NEW.voucher_issued_date IS NULL THEN
      RAISE EXCEPTION 'voucher_issued_date must be set before voucher_paid_date';
    END IF;
    NEW.payout_due_date := NEW.voucher_paid_date + INTERVAL '14 days';
    NEW.payout_status   := 'pending';
  END IF;
  IF NEW.payout_paid_date IS NOT NULL AND OLD.payout_paid_date IS NULL THEN
    NEW.payout_status := 'paid';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_voucher_payout ON public.program_enrollments;
CREATE TRIGGER trg_enrollment_voucher_payout
  BEFORE UPDATE ON public.program_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.fn_enrollment_voucher_payout();
