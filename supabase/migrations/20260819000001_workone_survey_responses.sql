-- WorkOne Survey Responses Table
-- Stores answers from applicants about their WorkOne experience

CREATE TABLE IF NOT EXISTS public.workone_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Applicant reference (from applications table)
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  applicant_email TEXT NOT NULL,
  applicant_name TEXT,
  
  -- Survey metadata
  survey_label TEXT NOT NULL DEFAULT 'workone-funding-survey',
  sent_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Survey answers
  went_to_workone BOOLEAN,
  signed_up_for_funding BOOLEAN,
  still_needs_to_go BOOLEAN,
  was_put_in_other_program BOOLEAN,
  was_persuaded_away_from_elevate BOOLEAN,
  other_program_details TEXT,
  feedback TEXT,
  
  -- Additional contact preference
  wants_callback BOOLEAN DEFAULT FALSE,
  preferred_contact_method TEXT,
  best_phone TEXT,
  
  -- Admin notes
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying responses
CREATE INDEX IF NOT EXISTS idx_workone_survey_email ON public.workone_survey_responses(applicant_email);
CREATE INDEX IF NOT EXISTS idx_workone_survey_submitted ON public.workone_survey_responses(submitted_at) WHERE submitted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workone_survey_app ON public.workone_survey_responses(application_id);

-- RLS: Staff and admin can read all
ALTER TABLE public.workone_survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin can read all survey responses"
  ON public.workone_survey_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Anyone can insert survey responses"
  ON public.workone_survey_responses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff and admin can update survey responses"
  ON public.workone_survey_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_workone_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workone_survey_responses_updated_at
  BEFORE UPDATE ON public.workone_survey_responses
  FOR EACH ROW EXECUTE FUNCTION update_workone_survey_updated_at();
