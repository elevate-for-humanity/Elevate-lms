-- 20260214_backfill_tenant_id.sql
--
-- Assigns tenant_id to all 501 NULL profiles and their downstream rows.
--
-- Census (2026-02-14):
--   501 profiles with NULL tenant_id
--   All created 2026-01-17 (batch seed)
--   All role=student, enrollment_status=pending
--   All email pattern: {name}{timestamp}@student.elevate.edu
--   86 enrollments linked to these profiles (also 2026-01-17)
--   0 certificates, 0 lesson_progress from these profiles
--
-- Assignment: All belong to tenant "Elevate for Humanity" (6ba71334-58f4-4104-9b2a-5114f2a7614c)
-- Rationale: Only real tenant. Other 5 tenants are test orgs created 2026-01-20.
--            These seed students were created for the Elevate platform.
--
-- Run each statement individually in Supabase SQL Editor.

-- ============================================================
-- STEP 1: Backfill profiles.tenant_id
-- ============================================================

-- Set all NULL-tenant profiles to Elevate for Humanity tenant
UPDATE profiles
SET tenant_id = '6ba71334-58f4-4104-9b2a-5114f2a7614c'
WHERE tenant_id IS NULL;

-- Also set organization_id for profiles that lack it
UPDATE profiles
SET organization_id = 'c2d91609-2040-42f1-baa2-9a12351e8588'
WHERE organization_id IS NULL;

-- ============================================================
-- STEP 2: Backfill auth.users user_metadata.tenant_id
-- ============================================================

-- This requires the auth.admin API, not raw SQL.
-- Run via application code or Supabase Dashboard > Authentication.
-- The auto_set_tenant_id trigger on downstream tables will use
-- profiles.tenant_id, so auth metadata is secondary.
--
-- For completeness, the app-side script would be:
--   for each profile where tenant_id was just set:
--     supabase.auth.admin.updateUserById(id, {
--       user_metadata: { tenant_id: '6ba71334-...' }
--     })

-- ============================================================
-- STEP 3: Backfill enrollments.tenant_id
-- (requires 20260214_add_tenant_id_to_core_tables.sql first)
-- ============================================================

-- After the column-addition migration runs, backfill any remaining NULLs
UPDATE training_enrollments
SET tenant_id = p.tenant_id
FROM profiles p
WHERE training_enrollments.user_id = p.id
  AND training_enrollments.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- ============================================================
-- STEP 4: Backfill shops and shop_staff
-- (requires 20260214_add_tenant_id_to_core_tables.sql first)
-- ============================================================

-- shops: derive from staff owner's profile
UPDATE shops
SET tenant_id = p.tenant_id
FROM shop_staff ss
JOIN profiles p ON p.id = ss.user_id
WHERE ss.shop_id = shops.id
  AND shops.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- shop_staff: derive from user's profile
UPDATE shop_staff
SET tenant_id = p.tenant_id
FROM profiles p
WHERE shop_staff.user_id = p.id
  AND shop_staff.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- ============================================================
-- STEP 5: Verify zero NULLs
-- ============================================================

-- Run these as verification queries (not statements):
-- SELECT count(*) FROM profiles WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM training_enrollments WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM certificates WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM lesson_progress WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM apprentice_placements WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM shops WHERE tenant_id IS NULL;
--   Expected: 0
-- SELECT count(*) FROM shop_staff WHERE tenant_id IS NULL;
--   Expected: 0
