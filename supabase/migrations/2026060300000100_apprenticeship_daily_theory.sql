-- Daily theory quiz gate for beauty apprenticeships (barber, cosmetology, nail, esthetician)
-- RTI/theory hours for a calendar day require passed=true (score >= 70) for that date.

CREATE TABLE IF NOT EXISTS public.apprenticeship_daily_theory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_slug text NOT NULL,
  theory_date date NOT NULL,
  lesson_id uuid,
  best_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (best_score >= 0 AND best_score <= 100),
  passed boolean NOT NULL DEFAULT false,
  attempt_count int NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_slug, theory_date)
);

CREATE INDEX IF NOT EXISTS idx_apprenticeship_daily_theory_user_date
  ON public.apprenticeship_daily_theory(user_id, program_slug, theory_date DESC);

ALTER TABLE public.apprenticeship_daily_theory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS apprenticeship_daily_theory_select_own ON public.apprenticeship_daily_theory;
CREATE POLICY apprenticeship_daily_theory_select_own
  ON public.apprenticeship_daily_theory FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS apprenticeship_daily_theory_insert_own ON public.apprenticeship_daily_theory;
CREATE POLICY apprenticeship_daily_theory_insert_own
  ON public.apprenticeship_daily_theory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS apprenticeship_daily_theory_update_own ON public.apprenticeship_daily_theory;
CREATE POLICY apprenticeship_daily_theory_update_own
  ON public.apprenticeship_daily_theory FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS apprenticeship_daily_theory_service ON public.apprenticeship_daily_theory;
CREATE POLICY apprenticeship_daily_theory_service
  ON public.apprenticeship_daily_theory FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.apprenticeship_daily_theory IS
  'One row per user/program/calendar day. passed=true (score>=70) required before RTI theory hours credit for that date.';
