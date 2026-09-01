-- One public consultation slot may have only one active booking.
-- This database constraint closes the race between availability display and form submission.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_one_active_consultation_per_slot_idx
  ON public.appointments (appointment_date, appointment_time)
  WHERE service_type = 'consultation'
    AND status IN ('active', 'scheduled')
    AND appointment_date IS NOT NULL
    AND appointment_time IS NOT NULL;
