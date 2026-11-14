-- Ensure exam_bookings has all payment, slot, add-on, and scheduling columns.
-- Idempotent — safe to re-run even if some columns already exist.
--
-- Covers columns added in:
--   20260604000008  payment_status, payment_intent_id, user_id, fee_cents, no-show/retake tracking
--   20260604000009  slot_id FK
--   20260608000001  add_on, add_on_paid
--   20260612000001  calendly_scheduling_url

-- Payment gate columns
ALTER TABLE public.exam_bookings
  ADD COLUMN IF NOT EXISTS user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status     text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_intent_id  text,
  ADD COLUMN IF NOT EXISTS fee_cents          integer,
  ADD COLUMN IF NOT EXISTS no_show_fee_paid   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_show_locked_at  timestamptz,
  ADD COLUMN IF NOT EXISTS attempts_used      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retake_fee_paid    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exam_result        text,
  ADD COLUMN IF NOT EXISTS result_recorded_at timestamptz;

-- Add CHECK constraint on payment_status only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'exam_bookings' AND constraint_name = 'exam_bookings_payment_status_check'
  ) THEN
    ALTER TABLE public.exam_bookings
      ADD CONSTRAINT exam_bookings_payment_status_check
        CHECK (payment_status IN ('unpaid','paid','waived','no_show_fee_required'));
  END IF;
END $$;

-- Add CHECK constraint on exam_result only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'exam_bookings' AND constraint_name = 'exam_bookings_exam_result_check'
  ) THEN
    ALTER TABLE public.exam_bookings
      ADD CONSTRAINT exam_bookings_exam_result_check
        CHECK (exam_result IN ('passed','failed','no_show','pending') OR exam_result IS NULL);
  END IF;
END $$;

-- Slot FK (testing_slots must exist first — created in 20260604000009)
ALTER TABLE public.exam_bookings
  ADD COLUMN IF NOT EXISTS slot_id uuid;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'testing_slots' AND table_schema = 'public')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'exam_bookings' AND constraint_name = 'exam_bookings_slot_id_fkey'
  ) THEN
    ALTER TABLE public.exam_bookings
      ADD CONSTRAINT exam_bookings_slot_id_fkey
        FOREIGN KEY (slot_id) REFERENCES public.testing_slots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add-on columns
ALTER TABLE public.exam_bookings
  ADD COLUMN IF NOT EXISTS add_on       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS add_on_paid  boolean NOT NULL DEFAULT false;

-- Calendly scheduling link
ALTER TABLE public.exam_bookings
  ADD COLUMN IF NOT EXISTS calendly_scheduling_url text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_bookings_payment_intent
  ON public.exam_bookings (payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exam_bookings_user_id
  ON public.exam_bookings (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exam_bookings_no_show_check
  ON public.exam_bookings (preferred_date, status, exam_result)
  WHERE status = 'confirmed' AND exam_result IS NULL;
