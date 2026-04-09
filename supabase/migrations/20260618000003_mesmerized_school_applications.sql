-- School applications table for Mesmerized by Beauty Cosmetology Academy.
-- Tracks applications for cosmetology, esthetician, and nail tech programs
-- submitted through the school landing page before apprenticeship placement.

CREATE TABLE IF NOT EXISTS public.school_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        UUID NOT NULL REFERENCES public.partners(id),

  -- Applicant info
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  city              TEXT,
  state             TEXT DEFAULT 'IN',
  zip               TEXT,
  date_of_birth     DATE,

  -- Program selection
  program_interest  TEXT NOT NULL CHECK (program_interest IN (
    'cosmetology-apprenticeship',
    'esthetician-apprenticeship',
    'nail-technician-apprenticeship'
  )),

  -- Funding / background
  funding_source    TEXT,
  prior_experience  TEXT,
  notes             TEXT,

  -- Workflow
  status            TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'accepted', 'waitlisted', 'rejected', 'enrolled'
  )),
  reviewed_by       UUID REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  placed_partner_id UUID REFERENCES public.partners(id),  -- apprenticeship placement shop

  -- Source tracking
  source            TEXT DEFAULT 'school_landing_page',
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_school_applications_partner   ON public.school_applications(partner_id);
CREATE INDEX idx_school_applications_email     ON public.school_applications(email);
CREATE INDEX idx_school_applications_program   ON public.school_applications(program_interest);
CREATE INDEX idx_school_applications_status    ON public.school_applications(status);
CREATE INDEX idx_school_applications_created   ON public.school_applications(created_at DESC);

ALTER TABLE public.school_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can read their own row matched directly on auth.email().
-- Using auth.email() avoids a profiles join — applicants may not have a
-- profiles row yet (they applied before creating an account).
CREATE POLICY "Applicants can view own application"
  ON public.school_applications FOR SELECT
  USING (
    email = auth.email()
  );

-- Admin / staff can manage all
CREATE POLICY "Admin can manage school applications"
  ON public.school_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access school_applications"
  ON public.school_applications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_school_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER school_applications_updated_at
  BEFORE UPDATE ON public.school_applications
  FOR EACH ROW EXECUTE FUNCTION update_school_applications_updated_at();

-- Grant SELECT to authenticated so RLS policies can evaluate.
-- INSERT is intentionally withheld — submissions go through the API route
-- (service role only). Direct client writes are blocked at the GRANT layer.
GRANT SELECT ON public.school_applications TO authenticated;
GRANT SELECT ON public.school_application_followups TO authenticated;

-- Update Mesmerized by Beauty contact info now that we have it
UPDATE public.partners
SET
  contact_email = 'mesmerizedbybeautyl@yahoo.com',
  contact_name  = 'Mesmerized by Beauty Cosmetology Academy',
  address       = '8325 Michigan Road',
  city          = 'Indianapolis',
  state         = 'IN',
  zip           = '46268',
  updated_at    = NOW()
WHERE name = 'Mesmerized by Beauty Cosmetology Academy';

UPDATE public.program_holders
SET
  contact_email = 'mesmerizedbybeautyl@yahoo.com',
  contact_name  = 'Mesmerized by Beauty Cosmetology Academy'
WHERE organization_name = 'Mesmerized by Beauty Cosmetology Academy';
