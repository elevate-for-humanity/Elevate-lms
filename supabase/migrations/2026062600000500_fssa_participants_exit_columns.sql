-- Adds exit interview and follow-up tracking columns to fssa_participants.
-- Required for FSSA TPP reporting: credential attainment, Q2/Q4 follow-up
-- employment status, wages, and exit case notes.

ALTER TABLE public.fssa_participants
  -- Credential / training outcome
  ADD COLUMN IF NOT EXISTS credential_attained        boolean,
  ADD COLUMN IF NOT EXISTS credential_name            text,
  ADD COLUMN IF NOT EXISTS credential_issued_date     date,

  -- Exit documentation
  ADD COLUMN IF NOT EXISTS exit_notes                 text,
  ADD COLUMN IF NOT EXISTS exit_recorded_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- ABAWD tracking
  ADD COLUMN IF NOT EXISTS abawd_exempt               boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS abawd_exemption_reason     text,

  -- Q2 follow-up (approx 6 months post-exit)
  ADD COLUMN IF NOT EXISTS q2_follow_up_date          date,
  ADD COLUMN IF NOT EXISTS q2_follow_up_completed     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS q2_employed                boolean,
  ADD COLUMN IF NOT EXISTS q2_employer_name           text,
  ADD COLUMN IF NOT EXISTS q2_hourly_wage             numeric(8,2),
  ADD COLUMN IF NOT EXISTS q2_hours_per_week          int,
  ADD COLUMN IF NOT EXISTS q2_notes                   text,

  -- Q4 follow-up (approx 12 months post-exit)
  ADD COLUMN IF NOT EXISTS q4_follow_up_date          date,
  ADD COLUMN IF NOT EXISTS q4_follow_up_completed     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS q4_employed                boolean,
  ADD COLUMN IF NOT EXISTS q4_employer_name           text,
  ADD COLUMN IF NOT EXISTS q4_hourly_wage             numeric(8,2),
  ADD COLUMN IF NOT EXISTS q4_hours_per_week          int,
  ADD COLUMN IF NOT EXISTS q4_notes                   text;

-- Auto-schedule Q2/Q4 follow-up dates when a participant exits
CREATE OR REPLACE FUNCTION public.schedule_fssa_followups()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Only fire when enrollment_status transitions to 'exited' or 'completed'
  IF NEW.enrollment_status IN ('exited', 'completed')
     AND (OLD.enrollment_status IS DISTINCT FROM NEW.enrollment_status)
     AND NEW.snap_et_exited_at IS NOT NULL
  THEN
    NEW.q2_follow_up_date := (NEW.snap_et_exited_at::date + INTERVAL '6 months')::date;
    NEW.q4_follow_up_date := (NEW.snap_et_exited_at::date + INTERVAL '12 months')::date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fssa_schedule_followups ON public.fssa_participants;
CREATE TRIGGER trg_fssa_schedule_followups
  BEFORE UPDATE ON public.fssa_participants
  FOR EACH ROW EXECUTE FUNCTION public.schedule_fssa_followups();

-- Index for follow-up queue (staff need to see who is due)
CREATE INDEX IF NOT EXISTS idx_fssa_participants_q2_followup
  ON public.fssa_participants(q2_follow_up_date)
  WHERE q2_follow_up_completed = false AND q2_follow_up_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fssa_participants_q4_followup
  ON public.fssa_participants(q4_follow_up_date)
  WHERE q4_follow_up_completed = false AND q4_follow_up_date IS NOT NULL;
