-- Add address and state columns to applications table
-- These are optional fields collected by some apply forms (FSSA, full application)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS state   text;
