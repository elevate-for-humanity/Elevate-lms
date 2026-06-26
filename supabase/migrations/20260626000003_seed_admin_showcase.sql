-- ============================================
-- UNIVERSAL TITAN SEEDING SCRIPT (FIXED)
-- Seeds admin account with ALL portal access
-- ============================================

DO $$ 
DECLARE
    target_user_id UUID;
    target_org_id UUID;
    target_enrollment_id UUID;
    target_program_id UUID;
    admin_email TEXT := 'curvaturebodysculpting@gmail.com';
BEGIN
    -- 1. Get the target user ID from profiles
    SELECT id INTO target_user_id FROM profiles WHERE email = admin_email;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User % not found. Please sign up first.', admin_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: % (%)', admin_email, target_user_id;

    -- 2. Create/Get a Master Showcase Organization
    SELECT id INTO target_org_id FROM organizations WHERE slug = 'elevate-global-showcase' LIMIT 1;
    
    IF target_org_id IS NULL THEN
        target_org_id := gen_random_uuid();
        INSERT INTO organizations (id, slug, name, type, is_active, status, created_at, updated_at)
        VALUES (target_org_id, 'elevate-global-showcase', 'Elevate Global Showcase', 'employer', true, 'active', now(), now());
        RAISE NOTICE 'Created organization: elevate-global-showcase';
    ELSE
        RAISE NOTICE 'Organization already exists: elevate-global-showcase';
    END IF;

    -- 3. Get a valid program ID (Barber Apprenticeship)
    SELECT id INTO target_program_id FROM programs WHERE slug = 'barber-apprenticeship' LIMIT 1;
    IF target_program_id IS NULL THEN
        SELECT id INTO target_program_id FROM programs LIMIT 1;
    END IF;
    RAISE NOTICE 'Using program ID: %', target_program_id;

    -- 4. Update profile with admin role and organization
    UPDATE profiles 
    SET 
        role = 'admin', 
        organization_id = target_org_id,
        onboarding_completed = true,
        full_name = COALESCE(full_name, 'Showcase Admin'),
        updated_at = now()
    WHERE id = target_user_id;
    RAISE NOTICE 'Updated profile with admin role';

    -- 5. Create/update program enrollment
    SELECT id INTO target_enrollment_id FROM program_enrollments WHERE user_id = target_user_id LIMIT 1;
    
    IF target_enrollment_id IS NULL THEN
        target_enrollment_id := gen_random_uuid();
        INSERT INTO program_enrollments (
            id, user_id, program_id, email, full_name, 
            status, amount_paid_cents, enrolled_at, 
            created_at, updated_at
        )
        VALUES (
            target_enrollment_id, target_user_id, target_program_id, 
            admin_email, 'Showcase Admin',
            'active', 0, now(),
            now(), now()
        );
        RAISE NOTICE 'Created enrollment for learner dashboard';
    ELSE
        UPDATE program_enrollments SET status = 'active', updated_at = now() WHERE id = target_enrollment_id;
        RAISE NOTICE 'Updated existing enrollment to active';
    END IF;

    -- 6. Add multiple roles to profiles.roles array for dashboard access
    UPDATE profiles 
    SET 
        roles = ARRAY[
            'admin', 'student', 'instructor', 'employer', 
            'partner', 'program_holder', 'mentor', 'case_manager', 
            'creator', 'staff'
        ],
        updated_at = now()
    WHERE id = target_user_id;
    RAISE NOTICE 'Added all portal roles to profile';

    -- 7. Create/update employer organization link if needed
    UPDATE profiles
    SET organization_id = target_org_id, updated_at = now()
    WHERE id = target_user_id AND organization_id IS NULL;
    RAISE NOTICE 'Linked user to organization';

    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'SUCCESS: Admin account is now set up for ALL portals!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Portal Access:';
    RAISE NOTICE '  /admin/dashboard - Admin Dashboard';
    RAISE NOTICE '  /learner/dashboard - Learner Dashboard';
    RAISE NOTICE '  /employer/dashboard - Employer Portal';
    RAISE NOTICE '  /partner/dashboard - Partner Portal';
    RAISE NOTICE '  /host-shop/dashboard - Host Shop Portal';
    RAISE NOTICE '  /admin/instructor/dashboard - Instructor Portal';
    RAISE NOTICE '  /admin/staff-portal/dashboard - Staff Portal';
    RAISE NOTICE '';
    RAISE NOTICE 'Log out and log back in to refresh session with new roles.';

END $$;
