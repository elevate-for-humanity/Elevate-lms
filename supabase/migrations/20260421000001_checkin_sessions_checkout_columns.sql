-- Add missing columns to checkin_sessions
-- Required by /api/checkin and /api/checkin/checkout

ALTER TABLE public.checkin_sessions
  ADD COLUMN IF NOT EXISTS apprentice_id uuid,
  ADD COLUMN IF NOT EXISTS checkin_code text,
  ADD COLUMN IF NOT EXISTS checkout_time timestamptz,
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

CREATE INDEX IF NOT EXISTS idx_checkin_sessions_apprentice_id
  ON public.checkin_sessions (apprentice_id);

CREATE INDEX IF NOT EXISTS idx_checkin_sessions_active
  ON public.checkin_sessions (apprentice_id)
  WHERE checkout_time IS NULL;
