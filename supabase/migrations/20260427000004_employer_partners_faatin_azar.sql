-- Seed employer partners for the Faatin Azar MOU batch.
-- Faatin Azar is an Elevate employer partner network contact who referred
-- a group of Indianapolis-area employers for MOU execution.
-- Apply in Supabase Dashboard → SQL Editor

INSERT INTO public.partners (
  name,
  owner_name,
  partner_type,
  contact_name,
  contact_email,
  contact_phone,
  city,
  state,
  description,
  is_active,
  display_order,
  created_at,
  updated_at
) VALUES
  (
    'Faatin Azar & Associates',
    'Faatin Azar & Associates',
    'employer',
    'Faatin Azar',
    'faatin.azar@example.com',
    NULL,
    'Indianapolis',
    'IN',
    'Employer partner network — workforce development and job placement referrals.',
    true,
    100,
    now(),
    now()
  )
ON CONFLICT (contact_email) DO UPDATE SET
  owner_name = COALESCE(EXCLUDED.owner_name, partners.owner_name),
  partner_type  = EXCLUDED.partner_type,
  contact_name  = EXCLUDED.contact_name,
  is_active     = EXCLUDED.is_active,
  updated_at    = now();

-- Add mou_version column to partners if not present (for tracking which MOU template was signed)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_version TEXT;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_pdf_url TEXT;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS mou_sent_at TIMESTAMPTZ;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS partner_type_detail TEXT;  -- e.g. 'cdl_training', 'healthcare', 'construction'
