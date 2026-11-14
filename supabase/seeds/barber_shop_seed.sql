-- Seed: minimum barber shop/partner pair required for enrollment assignment.
--
-- /api/partners?program=barber&status=active filters on:
--   partners.status = 'active'
--   partners.programs @> '["BARBER"]'   (jsonb contains)
--
-- /api/enrollment/barber verifies:
--   partners.status = 'active'
--
-- barber_shops and partners are independent tables (no FK between them).
-- barber_shops.is_approved gates the admin shop-approval workflow only.
-- The enrollment flow resolves entirely through partners.
--
-- Run this once in Supabase SQL editor after confirming no real shop exists.
-- Replace placeholder values with real shop details before going live.

-- Step 1: Create the partner (barbershop as a training partner)
INSERT INTO public.partners (
  name,
  city,
  state,
  zip,
  address,
  status,
  is_active,
  partner_type,
  programs,
  apprentice_capacity,
  mou_signed,
  documents_verified,
  onboarding_completed
)
VALUES (
  'Elevate Training Barbershop',       -- replace with real shop name
  'Indianapolis',
  'IN',
  '46204',
  '123 N Meridian St',                 -- replace with real address
  'active',
  true,
  'barbershop',
  '["BARBER"]'::jsonb,
  10,
  true,
  true,
  true
)
ON CONFLICT DO NOTHING
RETURNING id, name, status;

-- Step 2: Create the barber_shops record (for admin approval tracking)
-- This is separate from partners — used by admin/barber-shop-applications workflow.
INSERT INTO public.barber_shops (
  name,
  address,
  city,
  state,
  zip,
  is_approved,
  approved_at
)
VALUES (
  'Elevate Training Barbershop',
  '123 N Meridian St',
  'Indianapolis',
  'IN',
  '46204',
  true,
  now()
)
ON CONFLICT DO NOTHING
RETURNING id, name, is_approved;
