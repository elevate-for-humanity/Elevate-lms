-- Barber Apprenticeship: Instructor Sign-Off Layer
--
-- Instructors must formally sign off on:
--   1. Module competency completion (per module)
--   2. Practical hour blocks (bulk hour verification)
--   3. Final program readiness (gates exam eligibility)
--
-- No sign-off = module not complete, regardless of lesson progress.

CREATE TABLE IF NOT EXISTS public.barber_instructor_signoffs (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid         NOT NULL,
  approved_by     uuid         NOT NULL REFERENCES auth.users(id),

  signoff_type    text         NOT NULL CHECK (signoff_type IN (
                    'module_competency',   -- instructor confirms student mastered module skills
                    'hour_block',          -- instructor verifies a block of practical hours
                    'final_readiness'      -- instructor clears student for state board exam
                  )),

  -- For module_competency signoffs
  module_number   int          CHECK (module_number BETWEEN 1 AND 8),

  -- For hour_block signoffs
  hours_verified  numeric(5,2) CHECK (hours_verified > 0),
  hour_type       text         CHECK (hour_type IN ('theory', 'practical')),
  period_start    date,
  period_end      date,

  -- Competency assessment
  performance_rating  text     CHECK (performance_rating IN ('satisfactory', 'needs_improvement', 'unsatisfactory')),
  notes               text,
  conditions          text,    -- any conditions attached to the sign-off

  status          text         NOT NULL DEFAULT 'approved'
                    CHECK (status IN ('approved', 'conditional', 'revoked')),

  signed_at       timestamptz  NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  revoked_by      uuid,
  revoke_reason   text
);

CREATE INDEX IF NOT EXISTS idx_barber_signoffs_user
  ON public.barber_instructor_signoffs(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_barber_signoffs_module
  ON public.barber_instructor_signoffs(user_id, module_number)
  WHERE signoff_type = 'module_competency';
CREATE INDEX IF NOT EXISTS idx_barber_signoffs_instructor
  ON public.barber_instructor_signoffs(approved_by);

-- View: which modules have a valid (non-revoked) competency sign-off per student
CREATE OR REPLACE VIEW public.barber_module_signoff_status AS
SELECT
  user_id,
  program_id,
  module_number,
  MAX(signed_at) AS signed_at,
  MAX(approved_by::text)::uuid AS approved_by,
  bool_or(status = 'approved') AS is_signed_off
FROM public.barber_instructor_signoffs
WHERE signoff_type = 'module_competency'
  AND status != 'revoked'
GROUP BY user_id, program_id, module_number;

-- RLS
ALTER TABLE public.barber_instructor_signoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student reads own signoffs"     ON public.barber_instructor_signoffs;
DROP POLICY IF EXISTS "Instructor inserts signoffs"    ON public.barber_instructor_signoffs;
DROP POLICY IF EXISTS "Service role full signoffs"     ON public.barber_instructor_signoffs;

CREATE POLICY "Student reads own signoffs"
  ON public.barber_instructor_signoffs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Instructor inserts signoffs"
  ON public.barber_instructor_signoffs FOR INSERT WITH CHECK (auth.uid() = approved_by);
CREATE POLICY "Service role full signoffs"
  ON public.barber_instructor_signoffs USING (auth.role() = 'service_role');
