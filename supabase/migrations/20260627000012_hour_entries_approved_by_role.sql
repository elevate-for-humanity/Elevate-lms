-- Add approved_by_role to hour_entries.
-- Referenced by /api/apprenticeship/hours/approve and /api/employer/hours/approve
-- but never added to the schema.
ALTER TABLE public.hour_entries
  ADD COLUMN IF NOT EXISTS approved_by_role TEXT;
