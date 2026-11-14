-- apprentice_hours: tracks daily hour logs for cosmetology/esthetician/nail-tech apprentices.
-- Referenced by 15 code locations across pwa/ routes and pages.
-- Table already exists live — this migration documents the schema for audit purposes.

CREATE TABLE IF NOT EXISTS public.apprentice_hours (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline       text NOT NULL CHECK (discipline IN ('cosmetology', 'esthetician', 'nail-tech', 'barber')),
  date             date NOT NULL,
  hours            integer NOT NULL DEFAULT 0,
  minutes          integer NOT NULL DEFAULT 0 CHECK (minutes >= 0 AND minutes < 60),
  category         text,
  notes            text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at     timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apprentice_hours_user_id    ON public.apprentice_hours (user_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_discipline ON public.apprentice_hours (discipline);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_status     ON public.apprentice_hours (status);

COMMENT ON TABLE public.apprentice_hours IS
  'Daily hour log entries for apprenticeship programs (cosmetology, esthetician, nail-tech, barber)';
