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

INSERT INTO roles (id, name, description, is_system) VALUES
  ('10000000-0000-0000-0000-000000000001', 'super_admin', 'Platform owner. Full access across all tenants.', true),
  ('10000000-0000-0000-0000-000000000002', 'tenant_admin', 'Partner/org admin. Full access within their tenant.', true),
  ('10000000-0000-0000-0000-000000000003', 'instructor', 'Teaches courses, manages grades and attendance within tenant.', true),
  ('10000000-0000-0000-0000-000000000004', 'staff', 'Administrative staff. Read/write on operational tables within tenant.', true),
  ('10000000-0000-0000-0000-000000000005', 'student', 'Enrolled learner. Read-only on courses, write on own progress.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
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

-- Step 3: Bulk-assign student role to all profiles with role='student'
-- This populates user_roles for existing students on the default tenant.
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT
  p.id,
  '10000000-0000-0000-0000-000000000005',  -- student role
  '00000000-0000-0000-0000-000000000001',  -- default Elevate tenant
  now()
FROM profiles p
WHERE p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p.id
      AND ur.tenant_id = '00000000-0000-0000-0000-000000000001'
  );

-- Step 4: Assign admin role to profiles with role='admin'
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT
  p.id,
  '10000000-0000-0000-0000-000000000002',  -- tenant_admin role
  '00000000-0000-0000-0000-000000000001',  -- default Elevate tenant
  now()
FROM profiles p
WHERE p.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p.id
      AND ur.tenant_id = '00000000-0000-0000-0000-000000000001'
  );

-- Step 5: Assign instructor role to profiles with role='instructor'
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT
  p.id,
  '10000000-0000-0000-0000-000000000003',  -- instructor role
  '00000000-0000-0000-0000-000000000001',  -- default Elevate tenant
  now()
FROM profiles p
WHERE p.role = 'instructor'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = p.id
      AND ur.tenant_id = '00000000-0000-0000-0000-000000000001'
  );

-- Step 6: Populate tenant_members for all profiles on default tenant
INSERT INTO tenant_members (tenant_id, user_id, tenant_role, status, joined_at)
SELECT
  '00000000-0000-0000-0000-000000000001',
  p.id,
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
  SELECT 1 FROM tenant_members tm
  WHERE tm.user_id = p.id
    AND tm.tenant_id = '00000000-0000-0000-0000-000000000001'
);
