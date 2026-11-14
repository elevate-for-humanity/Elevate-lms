-- Add missing onboarding tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agreements_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS documents_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS handbook_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS orientation_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS funding_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS funding_source text,
  ADD COLUMN IF NOT EXISTS schedule_selected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_cohort text,
  ADD COLUMN IF NOT EXISTS cohort_start_date date,
  ADD COLUMN IF NOT EXISTS schedule_preference text;
