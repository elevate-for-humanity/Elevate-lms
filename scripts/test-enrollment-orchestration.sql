-- ============================================================================
-- COMPLETE END-TO-END ORCHESTRATION TEST
-- ============================================================================
-- This script creates test data, provides API call instructions,
-- and verifies the orchestration worked correctly.
-- ============================================================================

-- STEP 1: Create test user and profile
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_program_id UUID;
  v_enrollment_id UUID;
BEGIN
  -- Create test user (or use existing)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    'test-student-' || floor(random() * 10000) || '@example.com',
    crypt('test-password-123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;

  -- If user already existed, get their ID
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email LIKE 'test-student-%@example.com' 
    LIMIT 1;
  END IF;

  -- Create profile with pending enrollment_status
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    enrollment_status
  )
  VALUES (
    v_user_id,
    (SELECT email FROM auth.users WHERE id = v_user_id),
    'Test Student',
    'student',
    'pending'
  )
  ON CONFLICT (id) DO UPDATE
  SET enrollment_status = 'pending';

  -- Get a program ID (use first available program)
  SELECT id INTO v_program_id
  FROM programs
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'No programs found in database. Cannot create test enrollment.';
  END IF;

  -- Create pending enrollment
  INSERT INTO enrollments (
    id,
    user_id,
    program_id,
    status,
    payment_status
  )
  VALUES (
    gen_random_uuid(),
    v_user_id,
    v_program_id,
    'pending',
    'waived'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_enrollment_id;

  -- If enrollment already existed, get it
  IF v_enrollment_id IS NULL THEN
    SELECT id INTO v_enrollment_id
    FROM enrollments
    WHERE user_id = v_user_id
      AND program_id = v_program_id
      AND status = 'pending'
    LIMIT 1;
  END IF;

  -- Output test data
  RAISE NOTICE '=== TEST DATA CREATED ===';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Program ID: %', v_program_id;
  RAISE NOTICE 'Enrollment ID: %', v_enrollment_id;
  RAISE NOTICE '';
  RAISE NOTICE 'BEFORE STATE:';
  RAISE NOTICE '  enrollments.status = pending';
  RAISE NOTICE '  profiles.enrollment_status = pending';
  RAISE NOTICE '  enrollment_steps count = 0';
END $$;

-- STEP 2: Get the test enrollment details
-- ============================================================================
SELECT 
  '=== TEST ENROLLMENT DETAILS ===' as section,
  e.id as enrollment_id,
  e.user_id,
  e.program_id,
  p.name as program_name,
  e.status as enrollment_status,
  prof.enrollment_status as profile_status,
  e.created_at
FROM enrollments e
JOIN programs p ON p.id = e.program_id
JOIN profiles prof ON prof.id = e.user_id
WHERE e.status = 'pending'
ORDER BY e.created_at DESC
LIMIT 1;

-- STEP 3: Check if program has partner LMS configuration
-- ============================================================================
SELECT 
  '=== PROGRAM PARTNER LMS CONFIG ===' as section,
  ppl.program_id,
  plp.provider_name,
  ppl.sequence_order,
  ppl.is_required,
  'Steps will be generated from this config' as note
FROM program_partner_lms ppl
JOIN partner_lms_providers plp ON plp.id = ppl.provider_id
WHERE ppl.program_id = (
  SELECT program_id FROM enrollments WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1
)
ORDER BY ppl.sequence_order;

-- STEP 4: Instructions for API call
-- ============================================================================
DO $$
DECLARE
  v_enrollment_id UUID;
  v_site_url TEXT;
BEGIN
  SELECT id INTO v_enrollment_id
  FROM enrollments
  WHERE status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  v_site_url := COALESCE(current_setting('app.settings.site_url', true), 'http://localhost:3000');

  RAISE NOTICE '';
  RAISE NOTICE '=== API CALL INSTRUCTIONS ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Run this curl command (replace YOUR_JWT_TOKEN with admin/program_holder token):';
  RAISE NOTICE '';
  RAISE NOTICE 'curl -X POST %/api/enroll/approve \', v_site_url;
  RAISE NOTICE '  -H "Content-Type: application/json" \';
  RAISE NOTICE '  -H "Authorization: Bearer YOUR_JWT_TOKEN" \';
  RAISE NOTICE '  -d ''{"enrollment_id": "%"}''', v_enrollment_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Response:';
  RAISE NOTICE '{';
  RAISE NOTICE '  "success": true,';
  RAISE NOTICE '  "enrollmentId": "%",', v_enrollment_id;
  RAISE NOTICE '  "enrollment": { "status": "active", ... },';
  RAISE NOTICE '  "stepsGeneratedCount": <number>,';
  RAISE NOTICE '  "message": "Enrollment approved and activated successfully"';
  RAISE NOTICE '}';
  RAISE NOTICE '';
END $$;

-- STEP 5: Verification queries (run AFTER API call)
-- ============================================================================
COMMENT ON SCHEMA public IS 'Run these queries AFTER calling the approval API endpoint';

-- Query 5a: Verify enrollment status changed
SELECT 
  '=== AFTER API CALL: Enrollment Status ===' as section,
  e.id as enrollment_id,
  e.status as enrollment_status,
  'Should be: active' as expected,
  CASE WHEN e.status = 'active' THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM enrollments e
WHERE e.id = (
  SELECT id FROM enrollments WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'test-student-%@example.com'
  )
  ORDER BY created_at DESC LIMIT 1
);

-- Query 5b: Verify profile enrollment_status changed
SELECT 
  '=== AFTER API CALL: Profile Status ===' as section,
  p.id as user_id,
  p.enrollment_status as profile_status,
  'Should be: active' as expected,
  CASE WHEN p.enrollment_status = 'active' THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM profiles p
WHERE p.id IN (
  SELECT user_id FROM enrollments WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'test-student-%@example.com'
  )
  ORDER BY created_at DESC LIMIT 1
);

-- Query 5c: Verify enrollment steps were generated
SELECT 
  '=== AFTER API CALL: Enrollment Steps ===' as section,
  es.enrollment_id,
  COUNT(*) as steps_generated,
  'Should be: > 0' as expected,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM enrollment_steps es
WHERE es.enrollment_id = (
  SELECT id FROM enrollments WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'test-student-%@example.com'
  )
  ORDER BY created_at DESC LIMIT 1
)
GROUP BY es.enrollment_id;

-- Query 5d: Show detailed steps
SELECT 
  '=== AFTER API CALL: Step Details ===' as section,
  es.sequence_order,
  plp.provider_name,
  es.status,
  es.started_at,
  CASE 
    WHEN es.sequence_order = 1 AND es.status = 'in_progress' THEN '✅ First step started'
    WHEN es.status = 'pending' THEN '✅ Pending (correct)'
    ELSE '⚠️ Check status'
  END as validation
FROM enrollment_steps es
JOIN partner_lms_providers plp ON plp.id = es.provider_id
WHERE es.enrollment_id = (
  SELECT id FROM enrollments WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'test-student-%@example.com'
  )
  ORDER BY created_at DESC LIMIT 1
)
ORDER BY es.sequence_order;

-- Query 5e: Check audit log
SELECT 
  '=== AFTER API CALL: Audit Log ===' as section,
  al.action,
  al.entity,
  al.entity_id as enrollment_id,
  al.metadata->>'steps_generated' as steps_generated,
  al.created_at,
  CASE WHEN al.action = 'enrollment_approved' THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM audit_logs al
WHERE al.entity = 'enrollment'
  AND al.entity_id = (
    SELECT id FROM enrollments WHERE user_id IN (
      SELECT id FROM auth.users WHERE email LIKE 'test-student-%@example.com'
    )
    ORDER BY created_at DESC LIMIT 1
  )
ORDER BY al.created_at DESC
LIMIT 1;

-- STEP 6: Summary
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST EXECUTION SUMMARY ===';
  RAISE NOTICE '';
  RAISE NOTICE '1. ✅ Test data created (user, profile, enrollment)';
  RAISE NOTICE '2. 📋 Copy the curl command above';
  RAISE NOTICE '3. 🔑 Replace YOUR_JWT_TOKEN with actual admin/program_holder JWT';
  RAISE NOTICE '4. 🚀 Execute the curl command';
  RAISE NOTICE '5. ✅ Run verification queries (5a-5e above)';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Results:';
  RAISE NOTICE '  - enrollments.status = active';
  RAISE NOTICE '  - profiles.enrollment_status = active';
  RAISE NOTICE '  - enrollment_steps count > 0';
  RAISE NOTICE '  - First step status = in_progress';
  RAISE NOTICE '  - Audit log entry created';
  RAISE NOTICE '';
END $$;
