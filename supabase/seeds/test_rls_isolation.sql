-- RLS Isolation Test
-- Run in Supabase SQL Editor (dev/staging only — never production).
--
-- Verifies that a provider_admin from tenant A cannot read tenant B's
-- programs, enrollments, compliance artifacts, or profiles.
--
-- How Supabase RLS simulation works:
--   auth.uid() reads current_setting('request.jwt.claims')::json->>'sub'
--   RLS policies only activate when the session role is 'authenticated'
--   We use SET LOCAL ROLE + set_config to simulate a real user session
--
-- Each check block runs as the 'authenticated' role with user A's JWT claims.
-- The superuser role is restored between setup and checks via RESET ROLE.
--
-- Expected output (Messages panel): all checks show PASS.
-- The transaction rolls back — no data persists.

BEGIN;

-- ============================================================
-- SETUP (superuser — RLS bypassed for fixture inserts)
-- ============================================================

INSERT INTO tenants (id, name, slug, type, status, active) VALUES
  ('00000000-aaaa-0000-0000-000000000001', 'Test Provider Alpha', 'test-provider-alpha', 'partner_provider', 'active', true),
  ('00000000-bbbb-0000-0000-000000000001', 'Test Provider Beta',  'test-provider-beta',  'partner_provider', 'active', true);

INSERT INTO profiles (id, email, role, tenant_id) VALUES
  ('00000000-aaaa-0000-0000-000000000002', 'test-admin-alpha@test.invalid', 'provider_admin', '00000000-aaaa-0000-0000-000000000001'),
  ('00000000-bbbb-0000-0000-000000000002', 'test-admin-beta@test.invalid',  'provider_admin', '00000000-bbbb-0000-0000-000000000001');

INSERT INTO programs (id, title, tenant_id, published, is_active, status) VALUES
  ('00000000-aaaa-0000-0000-000000000003', 'Alpha HVAC Program',      '00000000-aaaa-0000-0000-000000000001', true, true, 'active'),
  ('00000000-bbbb-0000-0000-000000000003', 'Beta Electrical Program',  '00000000-bbbb-0000-0000-000000000001', true, true, 'active');

INSERT INTO program_enrollments (id, program_id, tenant_id, status) VALUES
  ('00000000-aaaa-0000-0000-000000000004', '00000000-aaaa-0000-0000-000000000003', '00000000-aaaa-0000-0000-000000000001', 'active'),
  ('00000000-bbbb-0000-0000-000000000004', '00000000-bbbb-0000-0000-000000000003', '00000000-bbbb-0000-0000-000000000001', 'active');

INSERT INTO provider_compliance_artifacts (id, tenant_id, artifact_type, label) VALUES
  ('00000000-aaaa-0000-0000-000000000005', '00000000-aaaa-0000-0000-000000000001', 'mou', 'Alpha MOU 2025'),
  ('00000000-bbbb-0000-0000-000000000005', '00000000-bbbb-0000-0000-000000000001', 'mou', 'Beta MOU 2025');

-- ============================================================
-- ISOLATION CHECKS
-- Switch to 'authenticated' role + set JWT claims for user A.
-- auth.uid() will resolve to user A's profile ID.
-- RLS policies activate and should block cross-tenant reads.
-- ============================================================

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"00000000-aaaa-0000-0000-000000000002","role":"authenticated"}',
  true  -- local to transaction
);

-- Check 1: programs
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM programs
  WHERE tenant_id = '00000000-bbbb-0000-0000-000000000001';
  IF n > 0 THEN
    RAISE WARNING 'FAIL programs: tenant A admin sees % tenant B programs (expected 0)', n;
  ELSE
    RAISE NOTICE 'PASS programs: tenant A admin sees 0 tenant B programs';
  END IF;
END;
$$;

-- Check 2: program_enrollments
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM program_enrollments
  WHERE tenant_id = '00000000-bbbb-0000-0000-000000000001';
  IF n > 0 THEN
    RAISE WARNING 'FAIL enrollments: tenant A admin sees % tenant B enrollments (expected 0)', n;
  ELSE
    RAISE NOTICE 'PASS enrollments: tenant A admin sees 0 tenant B enrollments';
  END IF;
END;
$$;

-- Check 3: provider_compliance_artifacts
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM provider_compliance_artifacts
  WHERE tenant_id = '00000000-bbbb-0000-0000-000000000001';
  IF n > 0 THEN
    RAISE WARNING 'FAIL artifacts: tenant A admin sees % tenant B artifacts (expected 0)', n;
  ELSE
    RAISE NOTICE 'PASS artifacts: tenant A admin sees 0 tenant B artifacts';
  END IF;
END;
$$;

-- Check 4: profiles
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM profiles
  WHERE tenant_id = '00000000-bbbb-0000-0000-000000000001';
  IF n > 0 THEN
    RAISE WARNING 'FAIL profiles: tenant A admin sees % tenant B profiles (expected 0)', n;
  ELSE
    RAISE NOTICE 'PASS profiles: tenant A admin sees 0 tenant B profiles';
  END IF;
END;
$$;

-- ============================================================
-- CLEANUP: roll back all fixture data
-- ============================================================

ROLLBACK;

-- All test data is gone after ROLLBACK. Re-run anytime.
--
-- To keep data for manual inspection, replace ROLLBACK with COMMIT
-- and clean up manually:
--   DELETE FROM tenants WHERE slug IN ('test-provider-alpha', 'test-provider-beta');
