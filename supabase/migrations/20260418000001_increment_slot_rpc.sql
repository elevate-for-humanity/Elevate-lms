-- Atomic slot booking-count increment RPC.
-- Called by /api/testing/book (org / waived-fee bookings) and
-- /api/testing/webhook (paid individual bookings) after inserting an exam_bookings row.
--
-- Uses UPDATE ... WHERE booked_count < capacity to prevent overselling —
-- if the slot is already full the UPDATE is a no-op (safe to call anyway).
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.increment_slot_booked_count(slot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.testing_slots
  SET    booked_count = booked_count + 1,
         updated_at   = now()
  WHERE  id             = slot_id
    AND  is_cancelled   = false
    AND  booked_count   < capacity;
END;
$$;

-- Grant execute to the service role (used by the admin Supabase client)
GRANT EXECUTE ON FUNCTION public.increment_slot_booked_count(uuid) TO service_role;
