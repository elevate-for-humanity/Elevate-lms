-- Testing center slot system and enforcement tables.
-- Apply in Supabase Dashboard → SQL Editor.

-- ── Availability slots (admin-created) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testing_slots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type       text NOT NULL,           -- provider key: 'workkeys', 'nha', 'certiport', etc.
  start_time      timestamptz NOT NULL,
  end_time        timestamptz NOT NULL,
  capacity        integer NOT NULL DEFAULT 10,
  booked_count    integer NOT NULL DEFAULT 0,
  location        text NOT NULL DEFAULT 'In-person — 8888 Keystone Crossing Suite 1300, Indianapolis IN 46240',
  proctor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           text,
  is_cancelled    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slots_capacity_positive CHECK (capacity > 0),
  CONSTRAINT slots_booked_lte_capacity CHECK (booked_count <= capacity),
  CONSTRAINT slots_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_testing_slots_exam_type_time
  ON public.testing_slots (exam_type, start_time)
  WHERE is_cancelled = false;

-- ── No-show fee tracking ─────────────────────────────────────────────────────
-- Links an exam_booking to a required no-show fee before rebooking is allowed.
CREATE TABLE IF NOT EXISTS public.testing_enforcement (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES public.exam_bookings(id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email               text NOT NULL,
  enforcement_type    text NOT NULL CHECK (enforcement_type IN ('no_show', 'retake', 'reschedule')),
  fee_cents           integer NOT NULL,
  fee_paid            boolean NOT NULL DEFAULT false,
  payment_intent_id   text,
  paid_at             timestamptz,
  locked_at           timestamptz NOT NULL DEFAULT now(),
  unlocked_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testing_enforcement_email
  ON public.testing_enforcement (email, fee_paid);

CREATE INDEX IF NOT EXISTS idx_testing_enforcement_user
  ON public.testing_enforcement (user_id, fee_paid)
  WHERE user_id IS NOT NULL;

-- ── Link exam_bookings to slots ──────────────────────────────────────────────
ALTER TABLE public.exam_bookings
  ADD COLUMN IF NOT EXISTS slot_id uuid REFERENCES public.testing_slots(id) ON DELETE SET NULL;

-- ── Helper: decrement slot on booking cancellation ───────────────────────────
CREATE OR REPLACE FUNCTION public.decrement_slot_on_cancel()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('cancelled') AND OLD.status NOT IN ('cancelled') AND OLD.slot_id IS NOT NULL THEN
    UPDATE public.testing_slots
    SET booked_count = GREATEST(0, booked_count - 1),
        updated_at   = now()
    WHERE id = OLD.slot_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_slot_on_cancel ON public.exam_bookings;
CREATE TRIGGER trg_decrement_slot_on_cancel
  AFTER UPDATE ON public.exam_bookings
  FOR EACH ROW EXECUTE FUNCTION public.decrement_slot_on_cancel();
