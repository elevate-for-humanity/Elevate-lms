-- employment_outcomes was created with integer PKs (legacy schema).
-- Table is empty — drop the NOT NULL constraint on the legacy integer user_id
-- and add UUID columns so the /api/outcomes route can write using Supabase auth UIDs.
DO $$ BEGIN
  ALTER TABLE public.employment_outcomes ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.employment_outcomes ALTER COLUMN program_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.employment_outcomes ALTER COLUMN verified_by DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

ALTER TABLE public.employment_outcomes
  ADD COLUMN IF NOT EXISTS user_uuid        uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recorded_by_uuid uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user_uuid
  ON public.employment_outcomes(user_uuid);
