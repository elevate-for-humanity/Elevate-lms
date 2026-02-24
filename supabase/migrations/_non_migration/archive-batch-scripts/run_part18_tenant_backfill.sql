-- ============================================================================
-- PHASE 1b: BACKFILL — Set tenant_id on all existing rows
-- ============================================================================
-- Run AFTER run_part17_tenant_isolation.sql
--
-- Strategy: All existing data belongs to Elevate (the platform operator).
-- We pick the first tenant from the tenants table as the default.
-- After this, every row has an owner. New rows from partners will get
-- their own tenant_id at insert time.
-- ============================================================================

-- Step 1: Ensure a default "Elevate" tenant exists
INSERT INTO tenants (id, name, slug, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Elevate for Humanity',
  'elevate',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Backfill the 7 newly-added tenant_id columns
-- (courses, lessons, modules, assignments, grades, job_placements, notifications)

UPDATE courses
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE lessons
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE modules
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE assignments
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE grades
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE job_placements
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE notifications
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Step 3: Backfill existing tables that ALREADY have tenant_id but null values

UPDATE profiles
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE enrollments
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE certificates
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE programs
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE lesson_progress
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE training_enrollments
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE cohorts
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE licenses
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE marketing_campaigns
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE marketing_contacts
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE student_applications
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE social_media_settings
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE shops
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE shop_staff
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE program_holder_applications
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE apprentice_placements
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE license_usage
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE tenant_licenses
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE tenant_memberships
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Step 4: Backfill organization_id where it exists but is null

UPDATE profiles
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE organization_id IS NULL;

UPDATE programs
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE organization_id IS NULL;

UPDATE users
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE organization_id IS NULL;
