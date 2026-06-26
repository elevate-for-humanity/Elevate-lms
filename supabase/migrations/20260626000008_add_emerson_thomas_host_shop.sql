-- ============================================
-- ADD EMERSON THOMAS - FRESH AZZ TAPERZ
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

-- 2. ADD VERIFIED COLUMN (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 3. CREATE OR FIND FRESH AZZ TAPERZ SHOP
DO $$
DECLARE
  emerson_user_id UUID;
  fresh_shop_id UUID;
BEGIN
  -- Find Emerson by email
  SELECT id INTO emerson_user_id FROM auth.users WHERE email = 'freshazztaperznow@gmail.com';
  
  -- Get or create Fresh Azz Taperz shop
  SELECT id INTO fresh_shop_id FROM shops WHERE name ILIKE '%fresh%azz%taperz%' OR name ILIKE '%fresh%taperz%' LIMIT 1;
  
  IF fresh_shop_id IS NULL THEN
    INSERT INTO shops (name, created_at)
    VALUES ('Fresh Azz Taperz', NOW())
    RETURNING id INTO fresh_shop_id;
  END IF;
  
  RAISE NOTICE 'Emerson User ID: %', emerson_user_id;
  RAISE NOTICE 'Fresh Azz Taperz Shop ID: %', fresh_shop_id;
END $$;

-- 4. UPDATE/INSERT PROFILE FOR EMERSON THOMAS
UPDATE profiles 
SET role = 'host_shop', 
    full_name = 'Emerson Thomas',
    phone = NULL,
    verified = true
WHERE email = 'freshazztaperznow@gmail.com';

-- 5. CREATE PARTNER RECORD (if partners table exists)
INSERT INTO partners (name, email, status, created_at)
VALUES ('Fresh Azz Taperz', 'freshazztaperznow@gmail.com', 'active', NOW())
ON CONFLICT DO NOTHING;

-- 6. UPDATE SHOP WITH OWNER INFO
UPDATE shops 
SET 
  owner_email = 'freshazztaperznow@gmail.com',
  owner_name = 'Emerson Thomas',
  status = 'active'
WHERE name ILIKE '%fresh%azz%taperz%' OR name ILIKE '%fresh%taperz%';

-- 7. ADD APPRENTICE SITE FOR FRESH AZZ TAPERZ
INSERT INTO apprentice_sites (name, latitude, longitude, radius_meters, shop_id, is_active)
SELECT 
  'Fresh Azz Taperz - Main Location',
  39.7684,  -- Indianapolis latitude
  -86.1581, -- Indianapolis longitude
  100,
  id,
  true
FROM shops 
WHERE name ILIKE '%fresh%azz%taperz%' OR name ILIKE '%fresh%taperz%'
AND NOT EXISTS (SELECT 1 FROM apprentice_sites WHERE shop_id = shops.id);

-- 8. VERIFY
SELECT '=== EMERSON THOMAS - HOST SHOP ===' as section;
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
WHERE p.email = 'freshazztaperznow@gmail.com';
