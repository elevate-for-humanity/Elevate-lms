-- Add 'apprentice' to the allowed roles in profiles table
-- Run this SQL to fix the role constraint

-- First, drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Re-add with apprentice role included
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin', 'super_admin', 'staff', 'instructor', 'employer', 
  'partner', 'student', 'apprentice', 'mentor', 'case_manager',
  'program_holder', 'creator', 'sponsor', 'host_shop', 'guest'
));

-- ============================================
-- APPRENTICE SETUP FOR ALL BARBER STUDENTS
-- ============================================

-- 1. Update all active barber apprenticeship students to apprentice role
UPDATE profiles 
SET role = 'apprentice'
WHERE id IN (
  SELECT pe.user_id 
  FROM program_enrollments pe
  WHERE pe.enrollment_state = 'active' 
    AND pe.program_slug ILIKE '%barber%'
);

-- 2. Find the Kountry Kutz shop (or create if not exists)
-- Check if Kountry Kutz exists in shops table
DO $$
DECLARE
  kountry_kutz_id UUID;
  kountry_kutz_partner_id UUID;
BEGIN
  -- Try to find Kountry Kutz in shops table
  SELECT id INTO kountry_kutz_id FROM shops WHERE name ILIKE '%kountry%kutz%' LIMIT 1;
  
  -- If not found, try partners table
  IF kountry_kutz_id IS NULL THEN
    SELECT id INTO kountry_kutz_partner_id FROM partners WHERE name ILIKE '%kountry%kutz%' LIMIT 1;
  END IF;
  
  RAISE NOTICE 'Found Kountry Kutz - Shop ID: %, Partner ID: %', kountry_kutz_id, kountry_kutz_partner_id;
END $$;

-- 3. Update/Insert apprentices records for barber students
-- Find shop IDs
DO $$
DECLARE
  kountry_kutz_shop_id UUID;
  elizabeth_shop_id UUID;
BEGIN
  SELECT id INTO kountry_kutz_shop_id FROM shops WHERE name ILIKE '%kountry%kutz%' LIMIT 1;
  SELECT id INTO elizabeth_shop_id FROM shops WHERE name ILIKE '%elizabeth%' LIMIT 1;
  
  RAISE NOTICE 'Kountry Kutz Shop ID: %', kountry_kutz_shop_id;
  RAISE NOTICE 'Elizabeth Shop ID: %', elizabeth_shop_id;
END $$;

-- Jordan White - Kountry Kutz
INSERT INTO apprentices (user_id, status, program_slug, start_date, shop_id)
SELECT 
  p.id,
  'active',
  'prestige-elevation-barber-curriculum',
  '2026-02-26'::date,
  (SELECT id FROM shops WHERE name ILIKE '%kountry%kutz%' LIMIT 1)
FROM profiles p
WHERE p.email = 'jbwhite888@icloud.com'
AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id)
ON CONFLICT (user_id) DO UPDATE SET shop_id = (SELECT id FROM shops WHERE name ILIKE '%kountry%kutz%' LIMIT 1);

-- Edgar Hernandez - Kountry Kutz
UPDATE profiles SET role = 'apprentice' WHERE email = 'itisjoel24@gmail.com';
INSERT INTO apprentices (user_id, status, program_slug, start_date, shop_id)
SELECT 
  p.id,
  'active',
  'prestige-elevation-barber-curriculum',
  '2026-05-27'::date,
  (SELECT id FROM shops WHERE name ILIKE '%kountry%kutz%' LIMIT 1)
FROM profiles p
WHERE p.email = 'itisjoel24@gmail.com'
AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id)
ON CONFLICT (user_id) DO UPDATE SET shop_id = (SELECT id FROM shops WHERE name ILIKE '%kountry%kutz%' LIMIT 1);

-- Natalia Roa - Kountry Kutz
UPDATE profiles SET role = 'apprentice' WHERE email = 'natataroa@gmail.com';
INSERT INTO apprentices (user_id, status, program_slug, start_date, shop_id)
SELECT 
  p.id,
  'active',
  'prestige-elevation-barber-curriculum',
  '2026-05-03'::date,
  (SELECT id FROM shops WHERE name ILIKE '%kountry%kutz%' LIMIT 1)
FROM profiles p
WHERE p.email = 'natataroa@gmail.com'
AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id)
ON CONFLICT (user_id) DO UPDATE SET shop_id = (SELECT id FROM shops WHERE name ILIKE '%kountry%kutz%' LIMIT 1);

-- Mercedes Wellington - Prestige Elevation
UPDATE profiles SET role = 'apprentice' WHERE email = 'msanqin@gmail.com';
INSERT INTO apprentices (user_id, status, program_slug, start_date, shop_id)
SELECT 
  p.id,
  'active',
  'prestige-elevation-barber-curriculum',
  '2026-04-13'::date,
  (SELECT id FROM shops WHERE name ILIKE '%prestige%elevation%' OR name ILIKE '%prestige%' LIMIT 1)
FROM profiles p
WHERE p.email = 'msanqin@gmail.com'
AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id)
ON CONFLICT (user_id) DO UPDATE SET shop_id = (SELECT id FROM shops WHERE name ILIKE '%prestige%elevation%' OR name ILIKE '%prestige%' LIMIT 1);

-- Elizabeth Powell - Cosmetology
UPDATE profiles SET role = 'apprentice' WHERE email = 'elizabethpowell6262@gmail.com';
INSERT INTO apprentices (user_id, status, program_slug, start_date)
SELECT 
  p.id,
  'active',
  'cosmetology-apprenticeship',
  '2026-06-07'::date
FROM profiles p
WHERE p.email = 'elizabethpowell6262@gmail.com'
AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id);

-- 4. Add apprentice_sites for the shops (if sites don't exist)
-- This allows apprentices to clock in at their assigned shops

-- Kountry Kutz site
INSERT INTO apprentice_sites (name, latitude, longitude, radius_meters, shop_id, is_active)
SELECT 
  'Kountry Kutz - Main Location',
  39.7684,  -- Indianapolis latitude
  -86.1581, -- Indianapolis longitude
  100,      -- 100 meter radius
  id,
  true
FROM shops
WHERE name ILIKE '%kountry%kutz%'
AND NOT EXISTS (
  SELECT 1 FROM apprentice_sites WHERE shop_id = shops.id
);

-- Elizabeth's shop site (for Mercedes Wellington)
INSERT INTO apprentice_sites (name, latitude, longitude, radius_meters, shop_id, is_active)
SELECT 
  'Prestige Elevation - Main Location',
  39.7684,  -- Indianapolis latitude
  -86.1581, -- Indianapolis longitude
  100,      -- 100 meter radius
  id,
  true
FROM shops
WHERE name ILIKE '%prestige%'
AND NOT EXISTS (
  SELECT 1 FROM apprentice_sites WHERE shop_id = shops.id
);

-- 5. Add verified column if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
UPDATE profiles SET verified = true WHERE role IN ('admin', 'super_admin');

-- Verify the fix
SELECT 'Apprentice Profiles:' as info;
SELECT full_name, email, role FROM profiles WHERE role = 'apprentice' ORDER BY full_name;

SELECT 'Apprentice Records:' as info;
SELECT a.*, p.full_name 
FROM apprentices a 
JOIN profiles p ON p.id = a.user_id 
WHERE p.email IN ('jbwhite888@icloud.com', 'msanqin@gmail.com', 'natataroa@gmail.com', 'itisjoel24@gmail.com', 'elizabethpowell6262@gmail.com');
