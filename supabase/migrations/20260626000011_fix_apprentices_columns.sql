-- ============================================
-- FIX: Add missing columns to apprentices table
-- ============================================

-- Add hours_completed column if it doesn't exist
ALTER TABLE apprentices ADD COLUMN IF NOT EXISTS hours_completed INT DEFAULT 0;

-- Add shop_id column if it doesn't exist (references shops table)
ALTER TABLE apprentices ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);

-- Add program_id column if it doesn't exist
ALTER TABLE apprentices ADD COLUMN IF NOT EXISTS program_id UUID;

-- ============================================
-- FIXED TITAN SEEDING SCRIPT
-- ============================================

DO $$ 
DECLARE
    target_user_id UUID;
    target_program_id UUID;
    target_shop_id UUID;
BEGIN
    -- 1. Get user
    SELECT id INTO target_user_id FROM profiles WHERE email = 'curvaturebodysculpting@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found.';
        RETURN;
    END IF;
    
    -- 2. Get barber program
    SELECT id INTO target_program_id FROM programs WHERE slug ILIKE '%barber%' LIMIT 1;
    
    -- 3. Get/Create shop
    SELECT id INTO target_shop_id FROM shops WHERE name ILIKE '%elevate%showcase%' OR name ILIKE '%global%showcase%' LIMIT 1;
    
    IF target_shop_id IS NULL THEN
        INSERT INTO shops (name, status, created_at) VALUES ('Elevate Global Showcase', 'active', NOW())
        RETURNING id INTO target_shop_id;
    END IF;
    
    RAISE NOTICE 'User: % | Program: % | Shop: %', target_user_id, target_program_id, target_shop_id;
    
    -- 4. Update Profile
    UPDATE profiles 
    SET role = 'admin', full_name = 'Showcase Admin', verified = true
    WHERE id = target_user_id;
    
    -- 5. Update Apprentices record (only columns that exist)
    UPDATE apprentices 
    SET status = 'active',
        program_id = target_program_id,
        shop_id = target_shop_id
    WHERE user_id = target_user_id;
    
    -- Insert apprentice if doesn't exist
    INSERT INTO apprentices (user_id, status, program_id, shop_id, enrollment_date)
    SELECT target_user_id, 'active', target_program_id, target_shop_id, NOW()::date
    WHERE NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = target_user_id);
    
    -- 6. Update Enrollment
    UPDATE program_enrollments 
    SET enrollment_state = 'active', status = 'active', progress_percent = 75
    WHERE user_id = target_user_id;
    
    INSERT INTO program_enrollments (user_id, program_slug, enrollment_state, status, progress_percent, enrollment_state_updated_at)
    SELECT target_user_id, 'barber-apprenticeship', 'active', 'active', 75, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM program_enrollments WHERE user_id = target_user_id);
    
    -- 7. Welcome Notification
    INSERT INTO notifications (user_id, type, title, message, action_url, created_at)
    SELECT target_user_id, 'welcome', 'Welcome to Elevate!', 
           'Your account is fully activated. Complete your onboarding to get started.',
           '/apprentice/onboarding', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = target_user_id AND type = 'welcome');
    
    RAISE NOTICE '✅ SUCCESS: Account activated!';
    
END $$;
