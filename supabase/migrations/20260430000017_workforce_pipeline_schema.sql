-- Workforce pipeline schema additions
-- Supports: consultation→applicant linkage, workforce referrals, employment outcomes,
--           post-enrollment application statuses, and referral agency tagging.

-- 1. Add application_id FK and zoom fields to appointments table
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS application_id  UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zoom_url        TEXT,
  ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
  ADD COLUMN IF NOT EXISTS attended_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_application_id ON public.appointments(application_id);

-- 2. Add scheduled_at and placed_at to applications for lifecycle timestamps
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS scheduled_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS placed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS referral_agency TEXT;
-- agency_name already exists from workforce_referrals_full_schema

-- 3. Ensure workforce_referrals has all required columns
CREATE TABLE IF NOT EXISTS public.workforce_referrals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name      TEXT NOT NULL,
  applicant_email     TEXT NOT NULL,
  applicant_phone     TEXT,
  agency_name         TEXT NOT NULL,
  case_manager_name   TEXT,
  case_manager_email  TEXT,
  case_manager_phone  TEXT,
  program_interest    TEXT,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'referred'
                        CHECK (status IN ('referred','contacted','enrolled','declined','exited')),
  application_id      UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_email         ON public.workforce_referrals(applicant_email);
CREATE INDEX IF NOT EXISTS idx_workforce_referrals_agency        ON public.workforce_referrals(agency_name);
CREATE INDEX IF NOT EXISTS idx_workforce_referrals_application_id ON public.workforce_referrals(application_id);

COMMENT ON TABLE public.workforce_referrals IS
  'Agency-to-applicant referral records for WorkOne, FSSA, and community org partners. Required for WIOA referral tracking.';

-- 4. Ensure employment_outcomes has all required columns
-- Table already exists; add missing columns first
ALTER TABLE public.employment_outcomes
  ADD COLUMN IF NOT EXISTS program_slug TEXT,
  ADD COLUMN IF NOT EXISTS outcome_type TEXT;

-- Add user_id if it doesn't exist (table was created without it in some environments)
DO $$ BEGIN
  ALTER TABLE public.employment_outcomes
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.employment_outcomes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_slug  TEXT NOT NULL,
  outcome_type  TEXT NOT NULL
                  CHECK (outcome_type IN ('employed','credential','military','education','self-employed','other')),
  employer_name TEXT,
  job_title     TEXT,
  hourly_wage   NUMERIC(8,2),
  start_date    DATE,
  notes         TEXT,
  recorded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user_id ON public.employment_outcomes(user_id);
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_program_slug ON public.employment_outcomes(program_slug);

COMMENT ON TABLE public.employment_outcomes IS
  'WIOA performance metric: employment, credential, military, and education outcomes post-program-completion.';

-- 5. Add submitted_by_partner flag to hour_entries for partner-submitted rows
ALTER TABLE public.hour_entries
  ADD COLUMN IF NOT EXISTS submitted_by_partner BOOLEAN NOT NULL DEFAULT false;
