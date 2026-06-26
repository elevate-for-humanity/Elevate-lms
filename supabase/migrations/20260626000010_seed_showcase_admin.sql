-- ============================================
-- CORRECTED TITAN SEEDING SCRIPT (Database Precision)
-- Based on actual schema from migration files
-- ============================================

DO $$ 
DECLARE
    target_user_id UUID;
    target_program_id UUID;
    target_shop_id UUID;
    target_apprentice_id UUID;
BEGIN
    -- 1. Get the target user ID
    SELECT id INTO target_user_id FROM profiles WHERE email = 'curvaturebodysculpting@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User curvaturebodysculpting@gmail.com not found.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'User ID: %', target_user_id;
    
    -- 2. Get barber program ID
    SELECT id INTO target_program_id FROM programs WHERE slug ILIKE '%barber%' LIMIT 1;
    
    IF target_program_id IS NULL THEN
        SELECT id INTO target_program_id FROM programs LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Program ID: %', target_program_id;
    
    -- 3. Get/Create shop
    SELECT id INTO target_shop_id FROM shops WHERE name ILIKE '%elevate%' OR name ILIKE '%showcase%' LIMIT 1;
    
    IF target_shop_id IS NULL THEN
        INSERT INTO shops (name, created_at) VALUES ('Elevate Global Showcase', NOW())
        RETURNING id INTO target_shop_id;
    END IF;
    
    RAISE NOTICE 'Shop ID: %', target_shop_id;
    
    -- 4. Wake up Profiles (Admin Role)
    UPDATE profiles 
    SET 
        role = 'admin', 
        full_name = 'Showcase Admin',
        verified = true
    WHERE id = target_user_id;
    
    -- 5. Wake up Learner/Apprentice Enrollment
    UPDATE program_enrollments 
    SET 
        enrollment_state = 'active',
        status = 'active',
        progress_percent = 75
    WHERE user_id = target_user_id;
    
    INSERT INTO program_enrollments (user_id, program_slug, enrollment_state, status, progress_percent, enrollment_state_updated_at)
    SELECT target_user_id, 'barber-apprenticeship', 'active', 'active', 75, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM program_enrollments WHERE user_id = target_user_id);
    
    -- 6. Wake up Apprentice Record
    SELECT id INTO target_apprentice_id FROM apprentices WHERE user_id = target_user_id LIMIT 1;
    
    UPDATE apprentices 
    SET 
        status = 'active',
        program_id = target_program_id,
        shop_id = target_shop_id,
        hours_completed = 45,
        enrollment_date = NOW()::date
    WHERE user_id = target_user_id;
    
    INSERT INTO apprentices (user_id, status, program_id, shop_id, hours_completed, enrollment_date)
    SELECT target_user_id, 'active', target_program_id, target_shop_id, 45, NOW()::date
    WHERE NOT EXISTS (SELECT 1 FROM apprentices WHERE user_id = target_user_id)
    RETURNING id INTO target_apprentice_id;
    
    RAISE NOTICE 'Apprentice ID: %', target_apprentice_id;
    
    -- 7. Wake up Apprentice Onboarding (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'apprentice_onboarding_progress') THEN
        UPDATE apprentice_onboarding_progress 
        SET status = 'completed', completed_at = NOW()
        WHERE user_id = target_user_id;
        
        INSERT INTO apprentice_onboarding_progress (user_id, status, profile_completed, profile_completed_at, documents_uploaded, documents_uploaded_at, host_shop_intro, host_shop_intro_at, clock_in_training, clock_in_training_at, syllabus_review, syllabus_review_at, agreement_signed, agreement_signed_at, first_clock_in, first_clock_in_at, started_at, completed_at)
        SELECT target_user_id, 'completed', true, NOW(), true, NOW(), true, NOW(), true, NOW(), true, NOW(), true, NOW(), true, NOW(), NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM apprentice_onboarding_progress WHERE user_id = target_user_id);
    END IF;
    
    -- 8. Wake up Barber Subscription (Payment)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'barber_subscriptions') THEN
        UPDATE barber_subscriptions 
        SET 
            payment_status = 'active',
            fully_paid = false,
            setup_fee_paid = true,
            amount_paid_at_checkout = 40000  -- $400
        WHERE user_id = target_user_id;
        
        INSERT INTO barber_subscriptions (user_id, full_tuition_amount, amount_paid_at_checkout, weekly_payment_cents, remaining_balance, payment_status, fully_paid, setup_fee_paid, next_payment_date, enrollment_date)
        SELECT target_user_id, 498000, 40000, 15000, 458000, 'active', false, true, NOW() + INTERVAL '14 days', NOW()::date
        WHERE NOT EXISTS (SELECT 1 FROM barber_subscriptions WHERE user_id = target_user_id);
    END IF;
    
    -- 9. Add Clock-In Hours (Progress Entries)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'progress_entries') THEN
        INSERT INTO progress_entries (user_id, clock_in, clock_out, date, total_minutes, within_geofence, shop_id)
        SELECT target_user_id, NOW() - INTERVAL '2 hours', NOW(), NOW()::date, 120, true, target_shop_id
        WHERE NOT EXISTS (SELECT 1 FROM progress_entries WHERE user_id = target_user_id AND date = NOW()::date);
    END IF;
    
    -- 10. Add Barber Workbook Progress
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'barber_workbook_progress') THEN
        UPDATE barber_workbook_progress 
        SET status = 'in_progress', total_hours_logged = 45, mentor_verified_hours = 40
        WHERE user_id = target_user_id;
        
        INSERT INTO barber_workbook_progress (user_id, section_1_haircutting_completed, total_hours_logged, mentor_verified_hours, status)
        SELECT target_user_id, false, 45, 40, 'in_progress'
        WHERE NOT EXISTS (SELECT 1 FROM barber_workbook_progress WHERE user_id = target_user_id);
    END IF;
    
    -- 11. Add Competency Records
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'apprentice_competency_records') THEN
        INSERT INTO apprentice_competency_records (user_id, program_id, competency_name, status, verified_at, notes)
        SELECT target_user_id, target_program_id, 'Safety & Sanitation', 'completed', NOW(), 'Passed safety test with 95%'
        WHERE NOT EXISTS (SELECT 1 FROM apprentice_competency_records WHERE user_id = target_user_id AND competency_name = 'Safety & Sanitation');
        
        INSERT INTO apprentice_competency_records (user_id, program_id, competency_name, status, verified_at, notes)
        SELECT target_user_id, target_program_id, 'Basic Haircutting', 'in_progress', NOW(), 'Working on fade techniques'
        WHERE NOT EXISTS (SELECT 1 FROM apprentice_competency_records WHERE user_id = target_user_id AND competency_name = 'Basic Haircutting');
    END IF;
    
    -- 12. Add Hour Entries (OJT Hours)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hour_entries') THEN
        -- Get apprentice application ID for hour_entries
        DECLARE
            app_id UUID;
        BEGIN
            SELECT id INTO app_id FROM apprentice_applications WHERE email = 'curvaturebodysculpting@gmail.com' LIMIT 1;
            
            IF app_id IS NOT NULL THEN
                INSERT INTO hour_entries (apprentice_application_id, source_type, source_entity_name, work_date, hours_claimed, accepted_hours, status, entered_by_email, entered_at)
                SELECT app_id, 'host_shop', 'Elevate Global Showcase', NOW()::date, 8, 8, 'approved', 'curvaturebodysculpting@gmail.com', NOW()
                WHERE NOT EXISTS (SELECT 1 FROM hour_entries WHERE apprentice_application_id = app_id AND work_date = NOW()::date);
            END IF;
        END;
    END IF;
    
    -- 13. Send Welcome Notification
    INSERT INTO notifications (user_id, type, title, message, action_url, action_label, created_at)
    SELECT target_user_id, 'welcome', 'Welcome to Elevate!', 'Your account is now fully activated. Complete your onboarding to get started.', '/apprentice/onboarding', 'Start Now', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = target_user_id AND type = 'welcome');
    
    RAISE NOTICE '✅ SUCCESS: All Titans are AWAKE!';
    
    -- 14. Verification
    RAISE NOTICE '=== VERIFICATION ===';
    RAISE NOTICE 'Profile: %', (SELECT full_name FROM profiles WHERE id = target_user_id);
    RAISE NOTICE 'Role: %', (SELECT role FROM profiles WHERE id = target_user_id);
    RAISE NOTICE 'Apprentice Status: %', (SELECT status FROM apprentices WHERE user_id = target_user_id);
    RAISE NOTICE 'Shop: %', (SELECT name FROM shops WHERE id = target_shop_id);
    
END $$;
