-- CF-4: Add post-enrollment placement tracking fields to applications.
-- WIOA requires tracking entered employment rate, retention rate, and
-- median earnings (ETA-9173 performance indicators).
-- New status flow: enrolled → scheduled → attended_orientation → assigned → placed → retained

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS session_id            uuid,
  ADD COLUMN IF NOT EXISTS orientation_date      date,
  ADD COLUMN IF NOT EXISTS employer_assigned_at  timestamptz,
  ADD COLUMN IF NOT EXISTS employer_assigned_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS placed_at             timestamptz,
  ADD COLUMN IF NOT EXISTS placement_employer    text,
  ADD COLUMN IF NOT EXISTS placement_job_title   text,
  ADD COLUMN IF NOT EXISTS placement_hourly_wage numeric(6,2),
  ADD COLUMN IF NOT EXISTS retained_at           timestamptz;

COMMENT ON COLUMN public.applications.session_id           IS 'FK to orientation_sessions — set when application moves to scheduled';
COMMENT ON COLUMN public.applications.orientation_date     IS 'Date learner attended orientation';
COMMENT ON COLUMN public.applications.employer_assigned_at IS 'Timestamp when learner was assigned to an employer/shop';
COMMENT ON COLUMN public.applications.employer_assigned_id IS 'User ID of the assigned employer';
COMMENT ON COLUMN public.applications.placed_at            IS 'Timestamp of job placement (WIOA entered employment date)';
COMMENT ON COLUMN public.applications.placement_employer   IS 'Employer name at placement';
COMMENT ON COLUMN public.applications.placement_job_title  IS 'Job title at placement';
COMMENT ON COLUMN public.applications.placement_hourly_wage IS 'Hourly wage at placement (WIOA median earnings metric)';
COMMENT ON COLUMN public.applications.retained_at          IS 'Timestamp of 2nd quarter retention confirmation (WIOA retention rate)';

CREATE INDEX IF NOT EXISTS idx_applications_session_id
  ON public.applications (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_placed_at
  ON public.applications (placed_at)
  WHERE placed_at IS NOT NULL;
