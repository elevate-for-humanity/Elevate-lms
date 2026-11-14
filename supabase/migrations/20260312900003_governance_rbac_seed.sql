-- ============================================================
-- Platform Governance & Security — RBAC Seed Migration
-- Adds missing roles, permissions, and role_permission mappings
-- ============================================================

-- Phase 1: Add missing roles
-- workforce_admin = workforce board / funding agency staff
INSERT INTO roles (name, description, is_system)
VALUES ('workforce_admin', 'Workforce board or funding agency administrator', true)
ON CONFLICT (name) DO NOTHING;

-- Phase 2: Add governance-specific permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  -- Programs
  ('programs.view',       'View programs',              'programs',     'view'),
  ('programs.create',     'Create programs',             'programs',     'create'),
  ('programs.edit',       'Edit programs',               'programs',     'edit'),
  ('programs.delete',     'Delete programs',             'programs',     'delete'),
  -- Lessons
  ('lessons.view',        'View lessons',                'lessons',      'view'),
  ('lessons.create',      'Create lessons',              'lessons',      'create'),
  ('lessons.edit',        'Edit lessons',                'lessons',      'edit'),
  ('lessons.delete',      'Delete lessons',              'lessons',      'delete'),
  -- Partners
  ('partners.view',       'View partners',               'partners',     'view'),
  ('partners.create',     'Create partners',             'partners',     'create'),
  ('partners.edit',       'Edit partners',               'partners',     'edit'),
  ('partners.delete',     'Delete partners',             'partners',     'delete'),
  -- Students
  ('students.view',       'View students',               'students',     'view'),
  ('students.edit',       'Edit students',               'students',     'edit'),
  -- Jobs
  ('jobs.view',           'View job listings',           'jobs',         'view'),
  ('jobs.create',         'Create job listings',         'jobs',         'create'),
  ('jobs.edit',           'Edit job listings',           'jobs',         'edit'),
  ('jobs.delete',         'Delete job listings',         'jobs',         'delete'),
  -- Hours
  ('hours.submit',        'Submit apprenticeship hours', 'hours',        'submit'),
  ('hours.approve',       'Approve apprenticeship hours','hours',        'approve'),
  ('hours.view',          'View apprenticeship hours',   'hours',        'view'),
  -- Credentials
  ('credentials.issue',   'Issue credentials',           'credentials',  'issue'),
  ('credentials.revoke',  'Revoke credentials',          'credentials',  'revoke'),
  ('credentials.view',    'View credentials',            'credentials',  'view'),
  -- Funding
  ('funding.view',        'View funding records',        'funding',      'view'),
  ('funding.create',      'Create funding records',      'funding',      'create'),
  ('funding.edit',        'Edit funding records',        'funding',      'edit'),
  ('funding.approve',     'Approve funding',             'funding',      'approve'),
  -- Security / audit
  ('security.view',       'View security dashboard',     'security',     'view'),
  ('security.manage',     'Manage security settings',    'security',     'manage'),
  ('audit.view',          'View audit logs',             'audit',        'view')
ON CONFLICT (name) DO NOTHING;

-- Phase 3: Seed role_permissions
-- Strategy: look up IDs dynamically so this is idempotent

-- super_admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin gets everything except security.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name != 'security.manage'
ON CONFLICT DO NOTHING;

-- staff: view + edit on courses, enrollments, students, programs, hours, credentials
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'staff'
  AND p.name IN (
    'courses.view', 'courses.create', 'courses.edit',
    'enrollments.view', 'enrollments.create', 'enrollments.edit',
    'students.view', 'students.edit',
    'programs.view',
    'lessons.view',
    'hours.view', 'hours.approve',
    'credentials.view', 'credentials.issue',
    'reports.view'
  )
ON CONFLICT DO NOTHING;

-- instructor: courses, lessons, students (view), enrollments (view)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'instructor'
  AND p.name IN (
    'courses.view', 'courses.edit',
    'lessons.view', 'lessons.create', 'lessons.edit',
    'students.view',
    'enrollments.view',
    'hours.view', 'hours.approve',
    'credentials.view'
  )
ON CONFLICT DO NOTHING;

-- student: own data only (view courses, submit hours, view credentials, view enrollments)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'student'
  AND p.name IN (
    'courses.view',
    'lessons.view',
    'enrollments.view',
    'hours.submit', 'hours.view',
    'credentials.view'
  )
ON CONFLICT DO NOTHING;

-- employer: jobs, hours approval, students (view candidates)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'employer'
  AND p.name IN (
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete',
    'hours.view', 'hours.approve',
    'students.view',
    'enrollments.view'
  )
ON CONFLICT DO NOTHING;

-- program_holder / program_owner: programs, courses, lessons, enrollments, students
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('program_holder', 'program_owner')
  AND p.name IN (
    'programs.view', 'programs.edit',
    'courses.view', 'courses.create', 'courses.edit',
    'lessons.view', 'lessons.create', 'lessons.edit',
    'enrollments.view', 'enrollments.create',
    'students.view',
    'hours.view',
    'credentials.view', 'credentials.issue',
    'reports.view'
  )
ON CONFLICT DO NOTHING;

-- workforce_admin: reports, funding, students (view), enrollments (view), credentials (view)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'workforce_admin'
  AND p.name IN (
    'reports.view', 'reports.export',
    'funding.view', 'funding.create', 'funding.edit', 'funding.approve',
    'students.view',
    'enrollments.view',
    'credentials.view',
    'programs.view',
    'audit.view'
  )
ON CONFLICT DO NOTHING;

-- partner: programs (view), students (view), enrollments (view)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'partner'
  AND p.name IN (
    'programs.view',
    'students.view',
    'enrollments.view',
    'hours.view',
    'credentials.view'
  )
ON CONFLICT DO NOTHING;

-- case_manager: students, enrollments, hours, credentials
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'case_manager'
  AND p.name IN (
    'students.view', 'students.edit',
    'enrollments.view', 'enrollments.create', 'enrollments.edit',
    'hours.view', 'hours.approve',
    'credentials.view', 'credentials.issue',
    'reports.view',
    'funding.view'
  )
ON CONFLICT DO NOTHING;

-- tenant_admin: everything within their tenant scope (same as admin minus security.manage)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'tenant_admin'
  AND p.name != 'security.manage'
ON CONFLICT DO NOTHING;
