-- employment_outcomes is missing start_date and recorded_by columns
-- required by the /api/outcomes POST route.
ALTER TABLE public.employment_outcomes
  ADD COLUMN IF NOT EXISTS start_date   date,
  ADD COLUMN IF NOT EXISTS recorded_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user_id
    ON public.employment_outcomes(user_id);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_employment_outcomes_program_slug
  ON public.employment_outcomes(program_slug);
