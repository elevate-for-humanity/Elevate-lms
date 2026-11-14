-- Atomic slot booking-count decrement RPC.
-- Called when an exam_booking is cancelled to release the seat.
-- Mirrors increment_slot_booked_count — never goes below 0.
-- Idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION public.decrement_slot_booked_count(slot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.testing_slots
  SET    booked_count = GREATEST(0, booked_count - 1),
         updated_at   = now()
  WHERE  id = slot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_slot_booked_count(uuid) TO service_role;
