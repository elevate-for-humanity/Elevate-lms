-- 20260214_enforce_tenant_not_null.sql
--
-- Enforces NOT NULL on tenant_id across the identity spine.
-- Uses Postgres NOT VALID + VALIDATE pattern for safe rollout:
--   1. Add CHECK constraint as NOT VALID (instant, no table scan)
--   2. VALIDATE CONSTRAINT (scans table, blocks only if violations exist)
--
-- Prerequisites:
--   - 20260214_backfill_tenant_id.sql must be applied first
--   - Verify zero NULLs before running this
--
-- Run each statement individually in Supabase SQL Editor.

-- ============================================================
-- STEP 1: Verify zero NULLs (run these first, abort if any return > 0)
-- ============================================================

-- SELECT count(*) FROM profiles WHERE tenant_id IS NULL;
-- SELECT count(*) FROM training_enrollments WHERE tenant_id IS NULL;
-- SELECT count(*) FROM certificates WHERE tenant_id IS NULL;
-- SELECT count(*) FROM lesson_progress WHERE tenant_id IS NULL;
-- SELECT count(*) FROM apprentice_placements WHERE tenant_id IS NULL;
-- SELECT count(*) FROM shops WHERE tenant_id IS NULL;
-- SELECT count(*) FROM shop_staff WHERE tenant_id IS NULL;

-- ============================================================
-- STEP 2: Add NOT VALID constraints (instant, no lock)
-- ============================================================

ALTER TABLE profiles
  ADD CONSTRAINT profiles_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE training_enrollments
  ADD CONSTRAINT training_enrollments_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE certificates
  ADD CONSTRAINT certificates_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE lesson_progress
  ADD CONSTRAINT lesson_progress_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE apprentice_placements
  ADD CONSTRAINT placements_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE shops
  ADD CONSTRAINT shops_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

ALTER TABLE shop_staff
  ADD CONSTRAINT shop_staff_tenant_id_not_null
  CHECK (tenant_id IS NOT NULL) NOT VALID;

-- ============================================================
-- STEP 3: Validate constraints (scans table, confirms no violations)
-- ============================================================

ALTER TABLE profiles
  VALIDATE CONSTRAINT profiles_tenant_id_not_null;

ALTER TABLE training_enrollments
  VALIDATE CONSTRAINT training_enrollments_tenant_id_not_null;

ALTER TABLE certificates
  VALIDATE CONSTRAINT certificates_tenant_id_not_null;

ALTER TABLE lesson_progress
  VALIDATE CONSTRAINT lesson_progress_tenant_id_not_null;

ALTER TABLE apprentice_placements
  VALIDATE CONSTRAINT placements_tenant_id_not_null;

ALTER TABLE shops
  VALIDATE CONSTRAINT shops_tenant_id_not_null;

ALTER TABLE shop_staff
  VALIDATE CONSTRAINT shop_staff_tenant_id_not_null;

-- ============================================================
-- STEP 4: Convert to actual NOT NULL (optional, cleaner schema)
-- ============================================================

-- Once constraints are validated, you can convert to real NOT NULL:
-- ALTER TABLE profiles ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE training_enrollments ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE certificates ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE lesson_progress ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE apprentice_placements ALTER COLUMN tenant_id SET NOT NULL;
--
-- Then drop the CHECK constraints:
-- ALTER TABLE profiles DROP CONSTRAINT profiles_tenant_id_not_null;
-- ALTER TABLE training_enrollments DROP CONSTRAINT training_enrollments_tenant_id_not_null;
-- ALTER TABLE certificates DROP CONSTRAINT certificates_tenant_id_not_null;
-- ALTER TABLE lesson_progress DROP CONSTRAINT lesson_progress_tenant_id_not_null;
-- ALTER TABLE apprentice_placements DROP CONSTRAINT placements_tenant_id_not_null;
