-- ============================================
-- COMPLETE APPRENTICE SETUP
-- Includes: roles, geofencing, payments, permissions
-- ============================================

-- 1. ADD APPRENTICE ROLE
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin', 'super_admin', 'staff', 'instructor', 'employer', 
  'partner', 'student', 'apprentice', 'mentor', 'case_manager',
  'program_holder', 'creator', 'sponsor', 'host_shop', 'guest'
));

-- 2. ADD VERIFIED COLUMN
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
UPDATE profiles SET verified = true WHERE role IN ('admin', 'super_admin');

-- 3. UPDATE PROFILES TO APPRENTICE ROLE
UPDATE profiles SET role = 'apprentice' WHERE email = 'jbwhite888@icloud.com';  -- Jordan
UPDATE profiles SET role = 'apprentice' WHERE email = 'itisjoel24@gmail.com';   -- Edgar
UPDATE profiles SET role = 'apprentice' WHERE email = 'natataroa@gmail.com';   -- Natalia
UPDATE profiles SET role = 'apprentice' WHERE email = 'msanqin@gmail.com';     -- Mercedes
UPDATE profiles SET role = 'apprentice' WHERE email = 'elizabethpowell6262@gmail.com'; -- Elizabeth

-- 4. UPDATE ALL ACTIVE BARBER STUDENTS TO APPRENTICE ROLE
UPDATE profiles 
SET role = 'apprentice'
WHERE id IN (
  SELECT pe.user_id 
  FROM program_enrollments pe
  WHERE pe.enrollment_state = 'active' 
    AND (pe.program_slug ILIKE '%barber%' OR pe.program_slug ILIKE '%prestige%')
);

-- 5. CREATE APPRENTICE RECORDS (simple INSERT without ON CONFLICT)
-- Note: apprentices_user_id_key constraint already exists

-- Jordan White - Kountry Kutz
INSERT INTO apprentices (user_id, status, program_id, shop_id)
SELECT p.id, 'active', pr.id, s.id
FROM profiles p, programs pr, shops s
WHERE p.email = 'jbwhite888@icloud.com' 
  AND pr.slug ILIKE '%barber%'
  AND s.name ILIKE '%kountry%kutz%'
  AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id);

-- Edgar Hernandez - Kountry Kutz
INSERT INTO apprentices (user_id, status, program_id, shop_id)
SELECT p.id, 'active', pr.id, s.id
FROM profiles p, programs pr, shops s
WHERE p.email = 'itisjoel24@gmail.com' 
  AND pr.slug ILIKE '%barber%'
  AND s.name ILIKE '%kountry%kutz%'
  AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id);

-- Natalia Roa - Kountry Kutz
INSERT INTO apprentices (user_id, status, program_id, shop_id)
SELECT p.id, 'active', pr.id, s.id
FROM profiles p, programs pr, shops s
WHERE p.email = 'natataroa@gmail.com' 
  AND pr.slug ILIKE '%barber%'
  AND s.name ILIKE '%kountry%kutz%'
  AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id);

-- Mercedes Wellington - Prestige Elevation
INSERT INTO apprentices (user_id, status, program_id, shop_id)
SELECT p.id, 'active', pr.id, s.id
FROM profiles p, programs pr, shops s
WHERE p.email = 'msanqin@gmail.com' 
  AND pr.slug ILIKE '%barber%'
  AND s.name ILIKE '%prestige%'
  AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id);

-- Elizabeth Powell - Cosmetology
INSERT INTO apprentices (user_id, status, program_id)
SELECT p.id, 'active', pr.id
FROM profiles p, programs pr
WHERE p.email = 'elizabethpowell6262@gmail.com' 
  AND pr.slug ILIKE '%cosmetology%'
  AND NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = p.id);

-- 6. ADD APPRENTICE SITES FOR GEOFENCING
-- Kountry Kutz site (Indianapolis coordinates)
INSERT INTO apprentice_sites (name, latitude, longitude, radius_meters, shop_id, is_active)
SELECT 'Kountry Kutz - Main', 39.7684, -86.1581, 100, id, true
FROM shops WHERE name ILIKE '%kountry%kutz%'
AND NOT EXISTS (SELECT 1 FROM apprentice_sites WHERE shop_id = shops.id);

-- Prestige Elevation site
INSERT INTO apprentice_sites (name, latitude, longitude, radius_meters, shop_id, is_active)
SELECT 'Prestige Elevation - Main', 39.7684, -86.1581, 100, id, true
FROM shops WHERE name ILIKE '%prestige%'
AND NOT EXISTS (SELECT 1 FROM apprentice_sites WHERE shop_id = shops.id);

-- 7. ACTIVATE ENROLLMENTS FOR PAYMENTS
UPDATE program_enrollments 
SET enrollment_state = 'active', status = 'active'
WHERE user_id IN (
  SELECT id FROM profiles WHERE email IN (
    'jbwhite888@icloud.com', 'itisjoel24@gmail.com', 'natataroa@gmail.com', 
    'msanqin@gmail.com', 'elizabethpowell6262@gmail.com'
  )
);

-- 8. RLS POLICIES FOR APPRENTICE ACCESS
-- Enable RLS on apprentice_sites
ALTER TABLE apprentice_sites ENABLE ROW LEVEL SECURITY;

-- Apprentice can read their own apprentice_sites
DROP POLICY IF EXISTS "apprentice_read_own_sites" ON apprentice_sites;
CREATE POLICY "apprentice_read_own_sites" ON apprentice_sites
  FOR SELECT USING (
    id IN (
      SELECT site_id FROM apprentice_assignments aa
      JOIN apprentices a ON a.id = aa.apprentice_id
      WHERE a.user_id = auth.uid()
      UNION
      SELECT s.id FROM apprentice_sites s
      JOIN apprentices a ON a.shop_id = s.shop_id
      WHERE a.user_id = auth.uid()
    )
  );

-- 9. VERIFY SETUP
SELECT '=== PROFILES (APPRENTICES) ===' as section;
SELECT full_name, email, role FROM profiles WHERE role = 'apprentice';

SELECT '=== APPRENTICES ===' as section;
SELECT p.full_name, a.status, s.name as shop
FROM apprentices a
JOIN profiles p ON p.id = a.user_id
LEFT JOIN shops s ON s.id = a.shop_id;

SELECT '=== APPRENTICE SITES ===' as section;
SELECT site.name, shop.name as shop, site.latitude, site.longitude, site.is_active
FROM apprentice_sites site
JOIN shops shop ON shop.id = site.shop_id;

SELECT '=== ENROLLMENTS ===' as section;
SELECT p.full_name, pe.program_slug, pe.enrollment_state, pe.status
FROM program_enrollments pe
JOIN profiles p ON p.id = pe.user_id
WHERE p.email IN ('jbwhite888@icloud.com', 'itisjoel24@gmail.com', 'natataroa@gmail.com', 'msanqin@gmail.com', 'elizabethpowell6262@gmail.com');
