-- Extend sub_office_agreements to support the full application form.
-- Adds all fields collected during suboffice onboarding.

ALTER TABLE public.sub_office_agreements
  ADD COLUMN IF NOT EXISTS business_name       text,
  ADD COLUMN IF NOT EXISTS ein                 text,
  ADD COLUMN IF NOT EXISTS business_address    text,
  ADD COLUMN IF NOT EXISTS city                text,
  ADD COLUMN IF NOT EXISTS state               text,
  ADD COLUMN IF NOT EXISTS zip                 text,
  ADD COLUMN IF NOT EXISTS contact_name        text,
  ADD COLUMN IF NOT EXISTS contact_email       text,
  ADD COLUMN IF NOT EXISTS contact_phone       text,
  ADD COLUMN IF NOT EXISTS ptin                text,
  ADD COLUMN IF NOT EXISTS efin                text,
  ADD COLUMN IF NOT EXISTS preparer_count      integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS acknowledged_split  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_addons boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_software boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_payroll boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_policy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ip_address          text,
  ADD COLUMN IF NOT EXISTS submitted_at        timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at         timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by         uuid REFERENCES auth.users(id);

-- Default status for new applications
ALTER TABLE public.sub_office_agreements
  ALTER COLUMN status SET DEFAULT 'pending';

COMMENT ON TABLE public.sub_office_agreements IS
  'Suboffice (tax prep franchise) onboarding applications. Submitted via /suboffice-onboarding/apply.';
