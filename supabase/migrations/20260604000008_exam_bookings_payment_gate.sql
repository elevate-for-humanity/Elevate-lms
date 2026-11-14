-- Add payment gate, no-show enforcement, and retake tracking to exam_bookings.
--
-- Apply in Supabase Dashboard → SQL Editor before deploying the booking API changes.

ALTER TABLE public.exam_bookings
  ADD COLUMN IF NOT EXISTS user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status     text NOT NULL DEFAULT 'unpaid'
                             CHECK (payment_status IN ('unpaid','paid','waived','no_show_fee_required')),
  ADD COLUMN IF NOT EXISTS payment_intent_id  text,
  ADD COLUMN IF NOT EXISTS fee_cents          integer,
  ADD COLUMN IF NOT EXISTS no_show_fee_paid   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS no_show_locked_at  timestamptz,
  ADD COLUMN IF NOT EXISTS attempts_used      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retake_fee_paid    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exam_result        text CHECK (exam_result IN ('passed','failed','no_show','pending',NULL)),
  ADD COLUMN IF NOT EXISTS result_recorded_at timestamptz;

-- Index for payment lookups (webhook matching)
CREATE INDEX IF NOT EXISTS idx_exam_bookings_payment_intent
  ON public.exam_bookings (payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- Index for user booking history
CREATE INDEX IF NOT EXISTS idx_exam_bookings_user_id
  ON public.exam_bookings (user_id)
  WHERE user_id IS NOT NULL;

-- Index for no-show enforcement cron
CREATE INDEX IF NOT EXISTS idx_exam_bookings_no_show_check
  ON public.exam_bookings (preferred_date, status, exam_result)
  WHERE status = 'confirmed' AND exam_result IS NULL;
