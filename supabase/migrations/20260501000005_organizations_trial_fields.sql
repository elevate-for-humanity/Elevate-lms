-- Add trial and contact fields to organizations table.
-- Required by /api/trial/start-managed to create org records.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_name  text,
  ADD COLUMN IF NOT EXISTS domain        text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_trial      boolean DEFAULT false;
