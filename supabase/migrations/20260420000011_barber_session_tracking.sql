-- Barber Apprenticeship: Session Tracking
--
-- A session is a timed block of active training.
-- No session = no hours. Hours are only credited after a session ends
-- and the elapsed active time is verified (idle periods subtracted).
--
-- Flow:
--   1. Student clicks "Start Training" → INSERT with status='active'
--   2. Heartbeats update last_heartbeat_at every 60s (idle detection)
--   3. Student clicks "End Session" or idle timeout fires →
--      UPDATE status='completed', ended_at=now(), active_seconds=calculated
--   4. API credits hours to barber_hour_ledger + inserts barber_hour_events row

-- Table already created by fix migration; just add missing columns
ALTER TABLE public.barber_training_sessions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS idle_seconds int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_seconds int,
  ADD COLUMN IF NOT EXISTS theory_hours_credited numeric(5,2),
  ADD COLUMN IF NOT EXISTS practical_hours_credited numeric(5,2),
  ADD COLUMN IF NOT EXISTS heartbeat_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_watch_seconds int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS module_number int,
  ADD COLUMN IF NOT EXISTS lesson_id uuid;
-- Skipping GENERATED ALWAYS AS (not supported via ADD COLUMN)
-- raw_seconds computed on read: EXTRACT(EPOCH FROM (COALESCE(ended_at,now())-started_at))::int

/*SKIP_ORIGINAL_CREATE_TABLE
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid         NOT NULL,
  module_number       int          NOT NULL CHECK (module_number BETWEEN 1 AND 8),
  lesson_id           uuid,        -- optional: which lesson triggered the session

  status              text         NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'abandoned', 'idle_timeout')),

  started_at          timestamptz  NOT NULL DEFAULT now(),
  ended_at            timestamptz,
  last_heartbeat_at   timestamptz  NOT NULL DEFAULT now(),

  -- Time accounting
  raw_seconds         int          GENERATED ALWAYS AS (
                        EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at))::int
                      ) STORED,
  idle_seconds        int          NOT NULL DEFAULT 0,  -- subtracted by idle detection
  active_seconds      int,         -- set on completion: raw_seconds - idle_seconds

  -- Hours credited from this session (set after completion)
  theory_hours_credited   numeric(5,2),
  practical_hours_credited numeric(5,2),

  -- Activity signals (updated by heartbeat)
  heartbeat_count     int          NOT NULL DEFAULT 0,
  video_watch_seconds int          NOT NULL DEFAULT 0,
  click_count         int          NOT NULL DEFAULT 0,

  created_at          timestamptz  NOT NULL DEFAULT now()
*/

CREATE INDEX IF NOT EXISTS idx_barber_sessions_user
  ON public.barber_training_sessions(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_barber_sessions_active
  ON public.barber_training_sessions(user_id, status)
  WHERE status = 'active';

-- RLS
ALTER TABLE public.barber_training_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student reads own sessions"   ON public.barber_training_sessions;
DROP POLICY IF EXISTS "Student inserts own sessions" ON public.barber_training_sessions;
DROP POLICY IF EXISTS "Student updates own sessions" ON public.barber_training_sessions;
DROP POLICY IF EXISTS "Service role full sessions"   ON public.barber_training_sessions;

CREATE POLICY "Student reads own sessions"
  ON public.barber_training_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Student inserts own sessions"
  ON public.barber_training_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Student updates own sessions"
  ON public.barber_training_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full sessions"
  ON public.barber_training_sessions USING (auth.role() = 'service_role');
