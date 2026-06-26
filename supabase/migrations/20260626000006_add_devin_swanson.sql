-- ============================================
-- CREATE APPRENTICE ONBOARDING PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS apprentice_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Onboarding steps
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_completed_at TIMESTAMPTZ,
  
  documents_uploaded BOOLEAN DEFAULT FALSE,
  documents_uploaded_at TIMESTAMPTZ,
  
  host_shop_intro BOOLEAN DEFAULT FALSE,
  host_shop_intro_at TIMESTAMPTZ,
  
  clock_in_training BOOLEAN DEFAULT FALSE,
  clock_in_training_at TIMESTAMPTZ,
  
  syllabus_review BOOLEAN DEFAULT FALSE,
  syllabus_review_at TIMESTAMPTZ,
  
  agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_signed_at TIMESTAMPTZ,
  
  first_clock_in BOOLEAN DEFAULT FALSE,
  first_clock_in_at TIMESTAMPTZ,
  
  -- Overall status
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apprentice_onboarding_user ON apprentice_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_onboarding_status ON apprentice_onboarding_progress(status);

ALTER TABLE apprentice_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Apprentice can view/edit their own onboarding
DROP POLICY IF EXISTS "apprentice_own_onboarding" ON apprentice_onboarding_progress;
CREATE POLICY "apprentice_own_onboarding" ON apprentice_onboarding_progress
  FOR ALL USING (auth.uid() = user_id);

-- Admin can view all
DROP POLICY IF EXISTS "admin_view_all_onboarding" ON apprentice_onboarding_progress;
CREATE POLICY "admin_view_all_onboarding" ON apprentice_onboarding_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

-- ============================================
-- ADD DEVIN SWANSON - CALS BARBERSHOP APPRENTICE
-- ============================================

-- 1. ADD APPRENTICE ROLE (in case not already done)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin', 'super_admin', 'staff', 'instructor', 'employer', 
  'partner', 'student', 'apprentice', 'mentor', 'case_manager',
  'program_holder', 'creator', 'sponsor', 'host_shop', 'guest'
));

-- 2. ADD VERIFIED COLUMN (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- 3. CREATE OR UPDATE PROFILE FOR DEVIN SWANSON
-- First check if user exists in auth.users
DO $$
DECLARE
  devin_user_id UUID;
  barber_program_id UUID;
  cals_shop_id UUID;
BEGIN
  -- Find Devin by email or create placeholder
  SELECT id INTO devin_user_id FROM auth.users WHERE email = 'Dawgchopz@icloud.com';
  
  -- Get barber program ID
  SELECT id INTO barber_program_id FROM programs WHERE slug ILIKE '%barber%' LIMIT 1;
  
  -- Get or create Cals Kutz Studio
  SELECT id INTO cals_shop_id FROM shops WHERE name ILIKE '%cals%barber%' OR name ILIKE '%cal%barber%' LIMIT 1;
  
  IF cals_shop_id IS NULL THEN
    -- Create Cals Kutz Studio
    INSERT INTO shops (name, created_at)
    VALUES ('Cals Kutz Studio', NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO cals_shop_id;
  END IF;
  
  RAISE NOTICE 'Devin User ID: %', devin_user_id;
  RAISE NOTICE 'Barber Program ID: %', barber_program_id;
  RAISE NOTICE 'Cals Shop ID: %', cals_shop_id;
END $$;

-- 4. UPDATE/INSERT PROFILE FOR DEVIN
-- Note: This assumes auth.users already exists with this email
-- If not, you'll need to create the user first in Supabase Auth

-- 5. CREATE APPRENTICE RECORD FOR DEVIN
INSERT INTO apprentices (user_id, status, program_id, shop_id
SELECT 
  (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'),
  'active',
  (SELECT id FROM programs WHERE slug ILIKE '%barber%' LIMIT 1),
  (SELECT id FROM shops WHERE name ILIKE '%cals%' LIMIT 1),
  '2026-06-26'::date
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
AND NOT EXISTS (
  SELECT 1 FROM apprentices 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
);

-- 6. UPDATE PROFILE ROLE
UPDATE profiles 
SET role = 'apprentice', 
    full_name = 'Devin Swanson',
    phone = '3172389254'
WHERE id = (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com');

-- 7. CREATE ENROLLMENT
INSERT INTO program_enrollments (
  user_id, 
  program_slug, 
  enrollment_state, 
  status,
  enrollment_state_updated_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'),
  (SELECT slug FROM programs WHERE slug ILIKE '%barber%' LIMIT 1),
  'active',
  'active',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
AND NOT EXISTS (
  SELECT 1 FROM program_enrollments 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
);

-- 8. ADD APPRENTICE SITE FOR CALS (if not exists)
INSERT INTO apprentice_sites (name, latitude, longitude, radius_meters, shop_id, is_active)
SELECT 
  'Cals Kutz Studio - Main',
  39.7684,  -- Indianapolis latitude
  -86.1581, -- Indianapolis longitude
  100,
  id,
  true
FROM shops 
WHERE name ILIKE '%cals%'
AND NOT EXISTS (SELECT 1 FROM apprentice_sites WHERE shop_id = shops.id);

-- 9. CREATE APPRENTICE ONBOARDING PROGRESS
INSERT INTO apprentice_onboarding_progress (
  user_id,
  profile_completed,
  profile_completed_at,
  documents_uploaded,
  documents_uploaded_at,
  host_shop_intro,
  host_shop_intro_at,
  clock_in_training,
  clock_in_training_at,
  syllabus_review,
  syllabus_review_at,
  agreement_signed,
  agreement_signed_at,
  first_clock_in,
  first_clock_in_at,
  status,
  started_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'),
  false,
  NULL,
  false,
  NULL,
  true,  -- Show host shop intro
  NOW(),
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  'in_progress',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
AND NOT EXISTS (
  SELECT 1 FROM apprentice_onboarding_progress 
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com')
);

-- 10. SEND WELCOME NOTIFICATION
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  action_url,
  action_label,
  metadata,
  created_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'Dawgchopz@icloud.com'),
  'welcome',
  'Welcome to Elevate, Devin!',
  'Complete your onboarding to get started with your barber apprenticeship at Cals Kutz Studio.',
  '/apprentice/onboarding',
  'Start Onboarding',
  '{"source": "admin_enrollment", "shop": "Cals Kutz Studio"}'::jsonb,
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'Dawgchopz@icloud.com');

-- 11. VERIFY
SELECT '=== NEW APPRENTICE ===' as section;
SELECT 
  p.full_name, 
  p.email, 
  p.phone,
  p.role,
  a.status as apprentice_status,
  s.name as shop,
  pe.enrollment_state,
  op.status as onboarding_status
FROM profiles p
LEFT JOIN apprentices a ON a.user_id = p.id
LEFT JOIN shops s ON s.id = a.shop_id
LEFT JOIN program_enrollments pe ON pe.user_id = p.id
LEFT JOIN apprentice_onboarding_progress op ON op.user_id = p.id
WHERE p.email = 'Dawgchopz@icloud.com';
