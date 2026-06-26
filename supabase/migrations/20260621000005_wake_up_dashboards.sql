-- ═══════════════════════════════════════════════════════════════════════
-- UNIVERSAL TITAN SEEDING SCRIPT
-- Purpose: Wake up all 13 portals for curvaturebodysculpting@gmail.com
-- ═══════════════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    target_user_id UUID;
    target_org_id UUID;
    target_program_id UUID;
BEGIN
    -- 1. Get the target user ID
    SELECT id INTO target_user_id FROM profiles WHERE email = 'curvaturebodysculpting@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User curvaturebodysculpting@gmail.com not found. Please sign up first.';
        RETURN;
    END IF;

    -- 2. Create/Get a Master Showcase Organization
    INSERT INTO organizations (id, name, type, is_active)
    VALUES (gen_random_uuid(), 'Elevate Global Showcase', 'host_shop', true)
    ON CONFLICT (name) DO UPDATE SET is_active = true
    RETURNING id INTO target_org_id;

    -- 3. Get a valid program ID (Barber)
    SELECT id INTO target_program_id FROM programs WHERE slug = 'barber-apprenticeship' LIMIT 1;

    -- 4. Wake up 'Profiles' (Role & Org)
    UPDATE profiles 
    SET 
        role = 'admin', -- Keep admin for God Mode access
        organization_id = target_org_id,
        onboarding_completed = true,
        full_name = 'Showcase Admin'
    WHERE id = target_user_id;

    -- 5. Wake up 'Learner' & 'Apprentice' portals
    INSERT INTO program_enrollments (user_id, program_id, program_slug, status, enrollment_state, progress_percent, host_shop_id)
    VALUES (target_user_id, target_program_id, 'barber-apprenticeship', 'active', 'active', 75, target_org_id)
    ON CONFLICT DO NOTHING;

    -- 6. Wake up 'Host Shop' metrics
    INSERT INTO ojt_hours (user_id, host_shop_id, hours, status, date)
    VALUES (target_user_id, target_org_id, 45, 'approved', now())
    ON CONFLICT DO NOTHING;

    -- 7. Wake up 'Instructor' portal
    -- Link user as an instructor to a training course
    INSERT INTO training_courses (course_name, instructor_id, program_id, is_active)
    VALUES ('Mastering the Fade', target_user_id, target_program_id, true)
    ON CONFLICT DO NOTHING;

    -- 8. Wake up 'Employer' portal
    -- Post a job for the showcase org
    INSERT INTO job_postings (employer_id, title, status, is_active)
    VALUES (target_org_id, 'Barber Apprentice Needed', 'published', true)
    ON CONFLICT DO NOTHING;

    -- 9. Wake up 'Case Manager' portal
    -- Create a referral record
    INSERT INTO applications (user_id, program_id, status, full_name, eligibility_status)
    VALUES (target_user_id, target_program_id, 'submitted', 'Showcase Applicant', 'verified')
    ON CONFLICT DO NOTHING;

    -- 10. Wake up 'Program Holder'
    INSERT INTO program_holders (organization_name, user_id, status)
    VALUES ('Elevate Global Showcase', target_user_id, 'approved')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ All 13 Titans are now AWAKE for curvaturebodysculpting@gmail.com';
END $$;
