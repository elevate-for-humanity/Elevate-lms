-- Add missing columns to mou_signatures so every partner type is identifiable
-- and all insert payloads from sign-mou routes are stored correctly.

ALTER TABLE public.mou_signatures
  ADD COLUMN IF NOT EXISTS partner_type    text,   -- 'barbershop' | 'cosmetology' | 'program_holder' | 'partner'
  ADD COLUMN IF NOT EXISTS organization_name text,
  ADD COLUMN IF NOT EXISTS contact_name    text,
  ADD COLUMN IF NOT EXISTS contact_title   text,
  ADD COLUMN IF NOT EXISTS contact_email   text,
  ADD COLUMN IF NOT EXISTS digital_signature text,
  ADD COLUMN IF NOT EXISTS agreed          boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS user_agent      text,
  ADD COLUMN IF NOT EXISTS countersigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS countersigned_by text;

CREATE INDEX IF NOT EXISTS idx_mou_signatures_partner_type
  ON public.mou_signatures (partner_type);

CREATE INDEX IF NOT EXISTS idx_mou_signatures_contact_email
  ON public.mou_signatures (contact_email);

COMMENT ON COLUMN public.mou_signatures.partner_type IS
  'Identifies which onboarding flow produced this MOU: barbershop | cosmetology | program_holder | partner';
