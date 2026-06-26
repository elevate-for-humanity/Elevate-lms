-- ============================================
-- ADD MARVIN WHITE - THE CULTURE BARBER COLLEGE
-- Host Shop Owner / Mentor
-- ============================================

-- 1. ADD HOST_SHOP ROLE (in case not already done)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin', 'super_admin', 'staff', 'instructor', 'employer', 
  'partner', 'student', 'apprentice', 'mentor', 'case_manager',
  'program_holder', 'creator', 'sponsor', 'host_shop', 'guest'
));

-- 2. CREATE OR FIND THE CULTURE BARBER COLLEGE SHOP
DO $$
DECLARE
  marvin_user_id UUID;
  culture_shop_id UUID;
BEGIN
  -- Find Marvin by email
  SELECT id INTO marvin_user_id FROM auth.users WHERE email = 'theculturebarbercollege@gmail.com';
  
  -- Get or create The Culture Barber College shop
  SELECT id INTO culture_shop_id FROM shops WHERE name ILIKE '%culture%barber%college%' OR name ILIKE '%culture%' LIMIT 1;
  
  IF culture_shop_id IS NULL THEN
    INSERT INTO shops (name, created_at)
    VALUES ('The Culture Barber College', NOW())
    RETURNING id INTO culture_shop_id;
  END IF;
  
  RAISE NOTICE 'Marvin User ID: %', marvin_user_id;
  RAISE NOTICE 'Culture Barber College Shop ID: %', culture_shop_id;
END $$;

-- 3. UPDATE/INSERT PROFILE FOR MARVIN WHITE
UPDATE profiles 
SET role = 'host_shop', 
    full_name = 'Marvin White',
    phone = '3318031843',
    verified = true
WHERE email = 'theculturebarbercollege@gmail.com';

-- 4. CREATE PARTNER RECORD (if partners table exists)
INSERT INTO partners (name, email, phone, status, created_at)
VALUES ('The Culture Barber College', 'theculturebarbercollege@gmail.com', '3318031843', 'active', NOW())
ON CONFLICT DO NOTHING;

-- 5. UPDATE SHOP WITH OWNER INFO
UPDATE shops 
SET 
  owner_email = 'theculturebarbercollege@gmail.com',
  owner_phone = '3318031843',
  owner_name = 'Marvin White',
  status = 'active'
WHERE name ILIKE '%culture%barber%college%' OR name ILIKE '%culture%';

-- 6. ADD APPRENTICE SITE FOR THE CULTURE BARBER COLLEGE
INSERT INTO apprentice_sites (name, latitude, longitude, radius_meters, shop_id, is_active)
SELECT 
  'The Culture Barber College - Main Location',
  39.7684,  -- Indianapolis latitude
  -86.1581, -- Indianapolis longitude
  100,
  id,
  true
FROM shops 
WHERE name ILIKE '%culture%barber%college%' OR name ILIKE '%culture%'
AND NOT EXISTS (SELECT 1 FROM apprentice_sites WHERE shop_id = shops.id);

-- 7. VERIFY
SELECT '=== MARVIN WHITE - HOST SHOP ===' as section;
SELECT 
  p.full_name, 
  p.email, 
  p.phone,
  p.role,
  p.verified,
  s.name as shop,
  s.status as shop_status
FROM profiles p
LEFT JOIN shops s ON s.owner_email = p.email
WHERE p.email = 'theculturebarbercollege@gmail.com';
