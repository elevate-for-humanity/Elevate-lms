-- 20260214_add_tenant_id_to_core_tables.sql
--
-- Adds tenant_id column to the 5 tables that lack it:
--   certificates, lesson_progress, apprentice_placements, shops, shop_staff
--
-- enrollments already has tenant_id (confirmed 2026-02-14 live query).
--
-- Then backfills from profiles via user_id/student_id/staff join.
-- Creates composite indexes for RLS performance.
-- Creates auto_set_tenant_id() trigger for future INSERTs.
--
-- Run each statement individually in Supabase SQL Editor.

-- ============================================================
-- STEP 1: Add tenant_id to tables that lack it
-- (enrollments already has tenant_id — skip)
-- ============================================================

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

ALTER TABLE apprentice_placements
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

ALTER TABLE shop_staff
  ADD COLUMN IF NOT EXISTS tenant_id uuid
  REFERENCES tenants(id);

-- ============================================================
-- STEP 2: Backfill tenant_id from profiles
-- ============================================================

-- certificates: join via user_id -> profiles.id
UPDATE certificates
SET tenant_id = p.tenant_id
FROM profiles p
WHERE certificates.user_id = p.id
  AND certificates.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- lesson_progress: join via user_id -> profiles.id
UPDATE lesson_progress
SET tenant_id = p.tenant_id
FROM profiles p
WHERE lesson_progress.user_id = p.id
  AND lesson_progress.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- apprentice_placements: join via student_id -> profiles.id
UPDATE apprentice_placements
SET tenant_id = p.tenant_id
FROM profiles p
WHERE apprentice_placements.student_id = p.id
  AND apprentice_placements.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- shop_staff: join via user_id -> profiles.id
-- (must run BEFORE shops so shops can derive from staff)
UPDATE shop_staff
SET tenant_id = p.tenant_id
FROM profiles p
WHERE shop_staff.user_id = p.id
  AND shop_staff.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- shops: derive from staff member's profile
UPDATE shops
SET tenant_id = p.tenant_id
FROM shop_staff ss
JOIN profiles p ON p.id = ss.user_id
WHERE ss.shop_id = shops.id
  AND shops.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- ============================================================
-- STEP 3: Indexes for RLS performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_training_enrollments_tenant_user
  ON training_enrollments(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_tenant_user
  ON certificates(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_tenant_user
  ON lesson_progress(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_placements_tenant_student
  ON apprentice_placements(tenant_id, student_id);

CREATE INDEX IF NOT EXISTS idx_shops_tenant
  ON shops(tenant_id);

CREATE INDEX IF NOT EXISTS idx_shop_staff_tenant_user
  ON shop_staff(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant
  ON profiles(tenant_id);

-- ============================================================
-- STEP 4: Auto-populate trigger for future INSERTs
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_set_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if tenant_id already set (e.g., by service role)
  IF NEW.tenant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Tables with user_id: training_enrollments, certificates, lesson_progress, shop_staff
  IF TG_TABLE_NAME IN ('training_enrollments', 'certificates', 'lesson_progress', 'shop_staff') THEN
    SELECT p.tenant_id INTO NEW.tenant_id
    FROM profiles p
    WHERE p.id = NEW.user_id;
    RETURN NEW;
  END IF;

  -- apprentice_placements: resolve via student_id
  IF TG_TABLE_NAME = 'apprentice_placements' THEN
    SELECT p.tenant_id INTO NEW.tenant_id
    FROM profiles p
    WHERE p.id = NEW.student_id;
    RETURN NEW;
  END IF;

  -- shops and any other table: resolve from current user
  SELECT p.tenant_id INTO NEW.tenant_id
  FROM profiles p
  WHERE p.id = auth.uid();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON training_enrollments;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON training_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON certificates;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON lesson_progress;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON apprentice_placements;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON apprentice_placements
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON shop_staff;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON shop_staff
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

DROP TRIGGER IF EXISTS set_tenant_id_on_insert ON shops;
CREATE TRIGGER set_tenant_id_on_insert
  BEFORE INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();
