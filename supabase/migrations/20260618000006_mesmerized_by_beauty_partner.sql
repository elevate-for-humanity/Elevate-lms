-- Onboard Mesmerized by Beauty Cosmetology Academy.
-- Migrating students from Memo Ed to the Elevate PWA.
-- MOU pending — contact details to be updated once partnership is finalized.

-- 1. Extend mou_type constraint to include cosmetology co-delivery
ALTER TABLE public.program_holders
  DROP CONSTRAINT IF EXISTS program_holders_mou_type_check;

ALTER TABLE public.program_holders
  ADD CONSTRAINT program_holders_mou_type_check
  CHECK (mou_type IN ('universal', 'custom_hvac_codelivery', 'custom_cosmetology_codelivery'));

-- 2. Insert partner record (idempotent — skip if name already exists)
INSERT INTO public.partners (
  name,
  owner_name,
  contact_email,
  partner_type,
  status,
  account_status,
  approval_status,
  state,
  is_active,
  programs,
  mou_signed,
  documents_verified,
  onboarding_completed,
  created_at,
  updated_at
)
SELECT
  'Mesmerized by Beauty Cosmetology Academy',
  'Mesmerized by Beauty Cosmetology Academy',
  'mesmerizedbybeautyl@yahoo.com',
  'cosmetology_school',
  'active',
  'active',
  'approved',
  'IN',
  true,
  '["cosmetology-apprenticeship"]'::jsonb,
  false,
  false,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners
  WHERE name = 'Mesmerized by Beauty Cosmetology Academy'
);

-- 3. Insert program_holder record (idempotent — skip if org name already exists)
INSERT INTO public.program_holders (
  name,
  organization_name,
  contact_email,
  mou_type,
  mou_signed,
  status,
  is_using_internal_lms,
  teaches_multiple,
  payout_status,
  created_at
)
SELECT
  'Mesmerized by Beauty Cosmetology Academy',
  'Mesmerized by Beauty Cosmetology Academy',
  'mesmerizedbybeautyl@yahoo.com',
  'custom_cosmetology_codelivery',
  false,
  'pending',
  true,
  false,
  'not_started',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.program_holders
  WHERE organization_name = 'Mesmerized by Beauty Cosmetology Academy'
);
