-- Barber Apprenticeship: Hour Ledger
--
-- Tracks theory + practical hours per student per module.
-- Theory hours are auto-credited from lesson completion (capped at module allocation).
-- Practical hours come from instructor-approved sessions and submissions.
--
-- 2000-hour distribution (Indiana DOL):
--   Module 1 — Infection Control & Safety:  200h (150 theory / 50 practical)
--   Module 2 — Hair Science & Scalp:        200h (150 theory / 50 practical)
--   Module 3 — Tools & Ergonomics:          200h (100 theory / 100 practical)
--   Module 4 — Haircutting:                 800h (100 theory / 700 practical)
--   Module 5 — Shaving & Beard:             300h  (50 theory / 250 practical)
--   Module 6 — Chemical Services:           200h (100 theory / 100 practical)
--   Module 7 — Business & Professional:     100h  (90 theory /  10 practical)
--   Module 8 — Exam Prep:                   100h (100 theory /   0 practical)

CREATE TABLE IF NOT EXISTS public.barber_hour_ledger (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid        NOT NULL,

  -- Running totals (denormalized for fast dashboard reads)
  total_hours         numeric(7,2) NOT NULL DEFAULT 0 CHECK (total_hours >= 0),
  theory_hours        numeric(7,2) NOT NULL DEFAULT 0 CHECK (theory_hours >= 0),
  practical_hours     numeric(7,2) NOT NULL DEFAULT 0 CHECK (practical_hours >= 0),

  -- Per-module theory hours (capped at allocation)
  mod1_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod2_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod3_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod4_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod5_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod6_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod7_theory         numeric(6,2) NOT NULL DEFAULT 0,
  mod8_theory         numeric(6,2) NOT NULL DEFAULT 0,

  -- Per-module practical hours
  mod1_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod2_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod3_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod4_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod5_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod6_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod7_practical      numeric(6,2) NOT NULL DEFAULT 0,
  mod8_practical      numeric(6,2) NOT NULL DEFAULT 0,

  last_session_start  timestamptz,
  last_session_end    timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_hour_ledger_user
  ON public.barber_hour_ledger(user_id);

-- Module theory caps (used by credit function to prevent over-crediting)
CREATE TABLE IF NOT EXISTS public.barber_module_hour_config (
  module_number       int         PRIMARY KEY,
  module_title        text        NOT NULL,
  theory_cap          numeric(6,2) NOT NULL,
  practical_required  numeric(6,2) NOT NULL,
  total_hours         numeric(6,2) NOT NULL
);

INSERT INTO public.barber_module_hour_config (module_number, module_title, theory_cap, practical_required, total_hours)
VALUES
  (1, 'Infection Control & Safety',  150, 50,  200),
  (2, 'Hair Science & Scalp',        150, 50,  200),
  (3, 'Tools & Ergonomics',          100, 100, 200),
  (4, 'Haircutting',                 100, 700, 800),
  (5, 'Shaving & Beard',              50, 250, 300),
  (6, 'Chemical Services',           100, 100, 200),
  (7, 'Business & Professional',      90,  10, 100),
  (8, 'Exam Prep',                   100,   0, 100)
ON CONFLICT (module_number) DO UPDATE SET
  theory_cap         = EXCLUDED.theory_cap,
  practical_required = EXCLUDED.practical_required,
  total_hours        = EXCLUDED.total_hours;

-- Individual hour credit events (audit trail)
CREATE TABLE IF NOT EXISTS public.barber_hour_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid        NOT NULL,
  module_number   int         NOT NULL CHECK (module_number BETWEEN 1 AND 8),
  hour_type       text        NOT NULL CHECK (hour_type IN ('theory', 'practical')),
  hours_credited  numeric(5,2) NOT NULL CHECK (hours_credited > 0),
  source          text        NOT NULL CHECK (source IN ('lesson_completion', 'session', 'submission', 'instructor_manual')),
  source_id       uuid,       -- lesson_id, session_id, submission_id, or signoff_id
  credited_by     uuid,       -- null = system, set = instructor
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_hour_events_user
  ON public.barber_hour_events(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_barber_hour_events_module
  ON public.barber_hour_events(user_id, module_number);

-- RLS
ALTER TABLE public.barber_hour_ledger    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_hour_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_module_hour_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own ledger"    ON public.barber_hour_ledger;
DROP POLICY IF EXISTS "Service role manages ledger" ON public.barber_hour_ledger;
CREATE POLICY "Students view own ledger"    ON public.barber_hour_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages ledger" ON public.barber_hour_ledger USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Students view own events"    ON public.barber_hour_events;
DROP POLICY IF EXISTS "Service role manages events" ON public.barber_hour_events;
CREATE POLICY "Students view own events"    ON public.barber_hour_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages events" ON public.barber_hour_events USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone reads module config"  ON public.barber_module_hour_config;
CREATE POLICY "Anyone reads module config"  ON public.barber_module_hour_config FOR SELECT USING (true);

