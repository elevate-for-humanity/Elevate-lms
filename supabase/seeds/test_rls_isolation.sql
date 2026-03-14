-- RLS Isolation Test Fixture
-- Run this in Supabase SQL Editor (dev/staging only — never production).
--
-- Creates two test tenants with one provider_admin each, then verifies
-- that each admin cannot read the other tenant's data.
--
-- Usage:
--   1. Run this script in Supabase SQL Editor
--   2. Check the RESULTS section at the bottom for PASS/FAIL
--   3. Clean up with the CLEANUP section at the bottom
--
-- Expected: all isolation checks return 0 rows (no cross-tenant leakage).

BEGIN;

-- ============================================================
-- SETUP: Two test tenants
-- ============================================================

DO $$
DECLARE
  v_tenant_a UUID;
  v_tenant_b UUID;
  v_user_a   UUID := gen_random_uuid();
  v_user_b   UUID := gen_random_uuid();
  v_prog_a   UUID;
  v_prog_b   UUID;
  v_enroll_a UUID;
  v_enroll_b UUID;
  v_artifact_a UUID;
  v_artifact_b UUID;

  -- Isolation check results
  r_programs_cross   INT;
  r_enrollments_cross INT;
  r_artifacts_cross  INT;
  r_profiles_cross   INT;
  v_pass             BOOLEAN := true;
BEGIN
  -- Create tenant A
  INSERT INTO tenants (name, slug, type, status, active)
  VALUES ('Test Provider Alpha', 'test-provider-alpha', 'partner_provider', 'active', true)
  RETURNING id INTO v_tenant_a;

  -- Create tenant B
  INSERT INTO tenants (name, slug, type, status, active)
  VALUES ('Test Provider Beta', 'test-provider-beta', 'partner_provider', 'active', true)
  RETURNING id INTO v_tenant_b;

  -- Create profiles for provider admins (no real auth users needed for RLS test)
  INSERT INTO profiles (id, email, role, tenant_id)
  VALUES (v_user_a, 'test-admin-alpha@test.invalid', 'provider_admin', v_tenant_a);

  INSERT INTO profiles (id, email, role, tenant_id)
  VALUES (v_user_b, 'test-admin-beta@test.invalid', 'provider_admin', v_tenant_b);

  -- Create a program for each tenant
  INSERT INTO programs (title, tenant_id, published, is_active, status)
  VALUES ('Alpha HVAC Program', v_tenant_a, true, true, 'active')
  RETURNING id INTO v_prog_a;

  INSERT INTO programs (title, tenant_id, published, is_active, status)
  VALUES ('Beta Electrical Program', v_tenant_b, true, true, 'active')
  RETURNING id INTO v_prog_b;

  -- Create an enrollment for each tenant
  INSERT INTO program_enrollments (program_id, tenant_id, status)
  VALUES (v_prog_a, v_tenant_a, 'active')
  RETURNING id INTO v_enroll_a;

  INSERT INTO program_enrollments (program_id, tenant_id, status)
  VALUES (v_prog_b, v_tenant_b, 'active')
  RETURNING id INTO v_enroll_b;

  -- Create compliance artifacts for each tenant
  INSERT INTO provider_compliance_artifacts (tenant_id, artifact_type, label)
  VALUES (v_tenant_a, 'mou', 'Alpha MOU 2025')
  RETURNING id INTO v_artifact_a;

  INSERT INTO provider_compliance_artifacts (tenant_id, artifact_type, label)
  VALUES (v_tenant_b, 'mou', 'Beta MOU 2025')
  RETURNING id INTO v_artifact_b;

  -- ============================================================
  -- ISOLATION CHECKS: Simulate user_a's RLS context
  -- Uses set_config to mock auth.uid() for RLS evaluation
  -- ============================================================

  -- Set session to user_a
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_user_a::text, 'role', 'authenticated')::text,
    true
  );

  -- Check 1: user_a should NOT see tenant_b's programs
  SELECT COUNT(*) INTO r_programs_cross
  FROM programs
  WHERE tenant_id = v_tenant_b;

  IF r_programs_cross > 0 THEN
    RAISE WARNING 'FAIL: provider_admin from tenant A can see % programs from tenant B', r_programs_cross;
    v_pass := false;
  ELSE
    RAISE NOTICE 'PASS: programs isolation — tenant A admin sees 0 tenant B programs';
  END IF;

  -- Check 2: user_a should NOT see tenant_b's enrollments
  SELECT COUNT(*) INTO r_enrollments_cross
  FROM program_enrollments
  WHERE tenant_id = v_tenant_b;

  IF r_enrollments_cross > 0 THEN
    RAISE WARNING 'FAIL: provider_admin from tenant A can see % enrollments from tenant B', r_enrollments_cross;
    v_pass := false;
  ELSE
    RAISE NOTICE 'PASS: enrollments isolation — tenant A admin sees 0 tenant B enrollments';
  END IF;

  -- Check 3: user_a should NOT see tenant_b's compliance artifacts
  SELECT COUNT(*) INTO r_artifacts_cross
  FROM provider_compliance_artifacts
  WHERE tenant_id = v_tenant_b;

  IF r_artifacts_cross > 0 THEN
    RAISE WARNING 'FAIL: provider_admin from tenant A can see % compliance artifacts from tenant B', r_artifacts_cross;
    v_pass := false;
  ELSE
    RAISE NOTICE 'PASS: compliance artifacts isolation — tenant A admin sees 0 tenant B artifacts';
  END IF;

  -- Check 4: user_a should NOT see tenant_b's profiles
  SELECT COUNT(*) INTO r_profiles_cross
  FROM profiles
  WHERE tenant_id = v_tenant_b;

  IF r_profiles_cross > 0 THEN
    RAISE WARNING 'FAIL: provider_admin from tenant A can see % profiles from tenant B', r_profiles_cross;
    v_pass := false;
  ELSE
    RAISE NOTICE 'PASS: profiles isolation — tenant A admin sees 0 tenant B profiles';
  END IF;

  -- Final verdict
  IF v_pass THEN
    RAISE NOTICE '✓ ALL ISOLATION CHECKS PASSED';
  ELSE
    RAISE WARNING '✗ ONE OR MORE ISOLATION CHECKS FAILED — review RLS policies';
  END IF;

  -- Store test tenant IDs for cleanup reference
  RAISE NOTICE 'Test tenant A: % (slug: test-provider-alpha)', v_tenant_a;
  RAISE NOTICE 'Test tenant B: % (slug: test-provider-beta)', v_tenant_b;
  RAISE NOTICE 'Test user A: %', v_user_a;
  RAISE NOTICE 'Test user B: %', v_user_b;

END;
$$;

-- ============================================================
-- CLEANUP: Roll back all test data
-- The transaction is rolled back so nothing persists.
-- ============================================================

ROLLBACK;

-- After ROLLBACK, all test data is gone.
-- Re-run anytime to re-verify isolation.
--
-- To run without rollback (persistent test data for manual inspection):
--   Replace ROLLBACK with COMMIT and note the tenant IDs from RAISE NOTICE.
--   Then clean up manually:
--     DELETE FROM tenants WHERE slug IN ('test-provider-alpha', 'test-provider-beta');
