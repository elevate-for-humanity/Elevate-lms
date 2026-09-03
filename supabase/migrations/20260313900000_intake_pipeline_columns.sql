-- Add intake pipeline columns to existing leads and applications tables.
-- These support the /start conversion funnel.

-- Leads: add full_name (composite), funding_interest, state
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS funding_interest text,
  ADD COLUMN IF NOT EXISTS state text;

-- Applications: add intake pipeline fields
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS has_indiana_career_connect boolean,
  ADD COLUMN IF NOT EXISTS has_workone_appointment boolean,
  ADD COLUMN IF NOT EXISTS intake_stage text DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS public_status_token uuid DEFAULT gen_random_uuid();

-- Unique index on status token for public lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_status_token
  ON public.applications(public_status_token)
  WHERE public_status_token IS NOT NULL;
