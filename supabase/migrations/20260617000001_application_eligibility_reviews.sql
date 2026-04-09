-- Application eligibility reviews table
-- Stores structured screening answers, decision codes, and support need flags
-- for every enrollment application. Tied to the applications table.
-- Status: eligible | conditional_review | ineligible
-- Reason codes are stored as text[] for auditability.

CREATE TABLE IF NOT EXISTS public.application_eligibility_reviews (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id              UUID REFERENCES public.applications(id) ON DELETE CASCADE,

  -- Funding
  funding_snap                BOOLEAN,
  funding_tanf                BOOLEAN,
  referral_partner            BOOLEAN,
  referral_source             TEXT,
  case_manager_name           TEXT,
  case_manager_email          TEXT,
  other_funding_source        TEXT,

  -- Residency / age
  age_confirmed               BOOLEAN,
  indiana_resident            BOOLEAN,

  -- Education
  education_level             TEXT,
  has_diploma_or_ged          BOOLEAN,
  enrolled_in_ged_program     BOOLEAN,

  -- Legal
  work_authorized             BOOLEAN,
  active_warrant              BOOLEAN,
  pending_charges             BOOLEAN,
  probation_or_parole         BOOLEAN,
  legal_notes                 TEXT,

  -- Readiness
  can_attend_schedule         BOOLEAN,
  has_transportation_plan     BOOLEAN,
  can_meet_physical           BOOLEAN,
  willing_to_follow_rules     BOOLEAN,
  willing_job_readiness       BOOLEAN,
  unavailable_times           TEXT,
  motivation                  TEXT,

  -- Support needs flags (set by system based on answers)
  support_needs_transport     BOOLEAN DEFAULT FALSE,
  support_needs_vehicle       BOOLEAN DEFAULT FALSE,
  support_needs_other         BOOLEAN DEFAULT FALSE,

  -- Acknowledgments
  agrees_attendance_policy    BOOLEAN DEFAULT FALSE,
  agrees_verification_policy  BOOLEAN DEFAULT FALSE,

  -- Decision (set by system, confirmed/overridden by staff)
  eligibility_status          TEXT NOT NULL DEFAULT 'incomplete'
                              CHECK (eligibility_status IN ('eligible','conditional_review','ineligible','incomplete')),
  eligibility_reason_codes    TEXT[] DEFAULT '{}',

  -- Staff review
  reviewer_name               TEXT,
  reviewer_decision           TEXT CHECK (reviewer_decision IN ('enroll','hold','do_not_enroll', NULL)),
  reviewer_notes              TEXT,
  reviewed_at                 TIMESTAMPTZ,

  -- Enrollment conditions (e.g. "Must provide SNAP verification within 7 days")
  enrollment_conditions       JSONB DEFAULT '[]',
  condition_deadline          DATE,

  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Add support need flags and eligibility status to applications table
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS eligibility_status       TEXT DEFAULT 'incomplete',
  ADD COLUMN IF NOT EXISTS funding_status           TEXT DEFAULT 'pending'
                           CHECK (funding_status IN ('verified','pending','none')),
  ADD COLUMN IF NOT EXISTS readiness_status         TEXT DEFAULT 'pending'
                           CHECK (readiness_status IN ('ready','conditional','not_ready','pending')),
  ADD COLUMN IF NOT EXISTS support_needs_transport  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS support_needs_vehicle    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS support_needs_other      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS case_manager_name        TEXT,
  ADD COLUMN IF NOT EXISTS case_manager_email       TEXT,
  ADD COLUMN IF NOT EXISTS referral_source          TEXT;

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_app_eligibility_status
  ON public.applications(eligibility_status);

CREATE INDEX IF NOT EXISTS idx_app_funding_status
  ON public.applications(funding_status);

CREATE INDEX IF NOT EXISTS idx_eligibility_reviews_application
  ON public.application_eligibility_reviews(application_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_eligibility_review_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_eligibility_review_updated_at ON public.application_eligibility_reviews;
CREATE TRIGGER trg_eligibility_review_updated_at
  BEFORE UPDATE ON public.application_eligibility_reviews
  FOR EACH ROW EXECUTE FUNCTION update_eligibility_review_timestamp();

-- RLS: staff and admin can read/write; applicant can read their own
ALTER TABLE public.application_eligibility_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access" ON public.application_eligibility_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "applicant_read_own" ON public.application_eligibility_reviews
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM public.applications WHERE user_id = auth.uid()
    )
  );
