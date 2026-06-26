-- ============================================
-- FINAL SEEDING SCRIPT - Only UPDATE statements
-- ============================================

DO $$ 
DECLARE
    target_user_id UUID;
    target_program_id UUID;
BEGIN
    -- Get user
    SELECT id INTO target_user_id FROM profiles WHERE email = 'curvaturebodysculpting@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found';
        RETURN;
    END IF;
    
    -- Get program
    SELECT id INTO target_program_id FROM programs WHERE slug ILIKE '%barber%' LIMIT 1;
    
    -- 1. Update Profile
    UPDATE profiles 
    SET role = 'admin', full_name = 'Showcase Admin', verified = true
    WHERE id = target_user_id;
    
    -- 2. Update Apprentice (only UPDATE, don't INSERT)
    IF EXISTS (SELECT 1 FROM apprentices WHERE user_id = target_user_id) THEN
        UPDATE apprentices SET status = 'active'
        WHERE user_id = target_user_id;
        RAISE NOTICE 'Apprentice status updated';
    ELSE
        RAISE NOTICE 'No apprentice record found - will be created on first login';
    END IF;
    
    -- 3. Update Enrollment
    UPDATE program_enrollments 
    SET enrollment_state = 'active', status = 'active', progress_percent = 75
    WHERE user_id = target_user_id;
    
    -- 4. Add Notification
    INSERT INTO notifications (user_id, type, title, message, action_url)
    SELECT target_user_id, 'welcome', 'Welcome!', 'Your dashboards are active.', '/apprentice'
    WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = target_user_id AND type = 'welcome');
    
    RAISE NOTICE '✅ DONE! User: % | Program: %', target_user_id, target_program_id;
END $$;
