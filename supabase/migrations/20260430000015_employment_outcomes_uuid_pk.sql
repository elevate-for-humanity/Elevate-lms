-- Rebuild employment_outcomes with a UUID primary key.
-- The table is empty (0 rows) so DROP + CREATE is safe.
-- Removes legacy integer columns (id, user_id, program_id, verified_by)
-- and consolidates to a clean schema aligned with the /api/outcomes route.

DROP TABLE IF EXISTS public.employment_outcomes;

CREATE TABLE IF NOT EXISTS public.employment_outcomes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_slug        text NOT NULL,
  outcome_type        text NOT NULL CHECK (outcome_type IN ('employed','credential','military','education','self-employed','other')),

  -- Employment details
  employer_name       text,
  job_title           text,
  industry            text,
  hourly_wage         numeric(10,2),
  annual_salary       numeric(12,2),
  hours_per_week      integer,
  employment_type     text CHECK (employment_type IN ('full-time','part-time','contract','self-employed') OR employment_type IS NULL),
  benefits_offered    boolean DEFAULT false,
  is_career_pathway   boolean DEFAULT false,
  start_date          date,
  exit_date           timestamptz,
  employed_at_exit    boolean DEFAULT false,

  -- WIOA retention tracking (2nd/4th quarter after exit)
  retained_30_days    boolean,
  retained_90_days    boolean,
  retained_180_days   boolean,
  retained_1_year     boolean,
  last_contact_date   date,
  next_followup_date  date,

  -- Verification
  verification_method text,
  verified_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at         timestamptz,

  -- Audit
  notes               text,
  recorded_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user_uuid    ON public.employment_outcomes(user_uuid);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_program_slug ON public.employment_outcomes(program_slug);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_outcome_type ON public.employment_outcomes(outcome_type);

-- RLS
ALTER TABLE public.employment_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_outcomes" ON public.employment_outcomes;
CREATE POLICY "users_own_outcomes" ON public.employment_outcomes
  FOR SELECT TO authenticated USING (user_uuid = auth.uid());

DROP POLICY IF EXISTS "admin_manage_outcomes" ON public.employment_outcomes;
CREATE POLICY "admin_manage_outcomes" ON public.employment_outcomes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
  ));
