-- applications.type is used by /api/applications to tag the applicant category
-- (student, employer, staff, program-holder, etc.)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'student';

CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(type);
