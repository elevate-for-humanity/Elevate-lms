-- ============================================================================
-- PHASE 2a: RBAC SEED — Populate role hierarchy for tenant-scoped access
-- ============================================================================
-- Run AFTER run_part20_rls_remaining_tenant_tables.sql
--
-- This ensures the roles table has the 5 standard roles for the platform,
-- then assigns the platform owner as super_admin on the default tenant.
-- ============================================================================

-- Step 1: Ensure standard role definitions exist
-- (roles table already has 9 rows; we upsert the 5 we need)

-- Upsert by name (unique constraint on name, not id)
INSERT INTO roles (name, description, is_system) VALUES
  ('super_admin', 'Platform owner. Full access across all tenants.', true),
  ('tenant_admin', 'Partner/org admin. Full access within their tenant.', true),
  ('instructor', 'Teaches courses, manages grades and attendance within tenant.', true),
  ('staff', 'Administrative staff. Read/write on operational tables within tenant.', true),
  ('student', 'Enrolled learner. Read-only on courses, write on own progress.', true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system;

-- Step 2: Assign super_admin role to the platform owner
-- This uses the default Elevate tenant from run_part18.
-- Replace the user_id below with the actual owner's profile ID.
-- To find it: SELECT id, email, role FROM profiles WHERE role = 'admin' OR role = 'super_admin';

-- PLACEHOLDER: Uncomment and set the real user ID after checking profiles
-- INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at) VALUES
--   ('<OWNER_PROFILE_ID>', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', now())
-- ON CONFLICT DO NOTHING;

-- Step 2b: Ensure Elevate exists in lms_organizations (user_roles FK target)
INSERT INTO lms_organizations (id, name)
SELECT t.id, t.name
FROM tenants t
WHERE t.slug = 'elevate-for-humanity'
  AND NOT EXISTS (SELECT 1 FROM lms_organizations WHERE id = t.id)
LIMIT 1;

-- Step 3: Bulk-assign roles using real tenant ID and role IDs from DB
DO $$
DECLARE
  v_tenant_id uuid;
  v_student_role_id uuid;
  v_admin_role_id uuid;
  v_instructor_role_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'elevate-for-humanity' LIMIT 1;
  SELECT id INTO v_student_role_id FROM roles WHERE name = 'student' LIMIT 1;
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'tenant_admin' LIMIT 1;
  SELECT id INTO v_instructor_role_id FROM roles WHERE name = 'instructor' LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Elevate tenant not found';
  END IF;

  -- Assign student role
  IF v_student_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
    SELECT p.id, v_student_role_id, v_tenant_id, now()
    FROM profiles p
    WHERE p.role = 'student'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.tenant_id = v_tenant_id
      );
  END IF;

  -- Assign admin role
  IF v_admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
    SELECT p.id, v_admin_role_id, v_tenant_id, now()
    FROM profiles p
    WHERE p.role = 'admin'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.tenant_id = v_tenant_id
      );
  END IF;

  -- Assign instructor role
  IF v_instructor_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
    SELECT p.id, v_instructor_role_id, v_tenant_id, now()
    FROM profiles p
    WHERE p.role = 'instructor'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id AND ur.tenant_id = v_tenant_id
      );
  END IF;

  -- Populate tenant_members
  INSERT INTO tenant_members (tenant_id, user_id, tenant_role, status, joined_at)
  SELECT
    v_tenant_id, p.id,
    CASE p.role
      WHEN 'admin' THEN 'admin'
      WHEN 'instructor' THEN 'instructor'
      WHEN 'staff' THEN 'staff'
      ELSE 'member'
    END,
    'active',
    COALESCE(p.created_at, now())
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM tenant_members tm WHERE tm.user_id = p.id AND tm.tenant_id = v_tenant_id
  );

  RAISE NOTICE 'RBAC seeded for tenant %', v_tenant_id;
END $$;
