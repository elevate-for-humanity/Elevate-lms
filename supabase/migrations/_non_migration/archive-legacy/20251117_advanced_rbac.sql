-- =====================================================
-- ADVANCED ROLE-BASED ACCESS CONTROL (RBAC)
-- =====================================================

-- Permissions Registry
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Permission Details
  permission_name VARCHAR(100) UNIQUE NOT NULL,
  permission_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'courses:create', 'users:delete'
  description TEXT,
  category VARCHAR(50), -- courses, users, reports, settings, etc.
  
  -- Hierarchy
  parent_permission_id UUID REFERENCES permissions(id),
  
  -- Metadata
  is_system BOOLEAN DEFAULT false, -- System permissions cannot be deleted
  is_dangerous BOOLEAN DEFAULT false, -- Requires extra confirmation
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  
  -- Role Details
  role_name VARCHAR(100) NOT NULL,
  role_key VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Type
  is_system BOOLEAN DEFAULT false, -- System roles: super_admin, admin, instructor, student
  is_custom BOOLEAN DEFAULT true,
  
  -- Hierarchy
  parent_role_id UUID REFERENCES roles(id),
  priority INTEGER DEFAULT 0, -- Higher priority = more permissions
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, role_key)
);

-- Role Permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  
  -- Grant Type
  grant_type VARCHAR(50) DEFAULT 'allow', -- allow, deny
  
  -- Conditions (JSON for complex rules)
  conditions JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role_id, permission_id)
);

-- User Roles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  
  -- Scope
  scope VARCHAR(50) DEFAULT 'global', -- global, course, department
  scope_id UUID, -- ID of course, department, etc.
  
  -- Temporary Assignment
  expires_at TIMESTAMPTZ,
  
  -- Audit
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, role_id, tenant_id, scope, scope_id)
);

-- Direct User Permissions (override role permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES lms_organizations(id) ON DELETE CASCADE,
  
  -- Grant Type
  grant_type VARCHAR(50) DEFAULT 'allow', -- allow, deny
  
  -- Scope
  scope VARCHAR(50) DEFAULT 'global',
  scope_id UUID,
  
  -- Temporary
  expires_at TIMESTAMPTZ,
  
  -- Audit
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, permission_id, tenant_id, scope, scope_id)
);

-- Permission Groups (for easier management)
CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Group Details
  group_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  
  -- Icon
  icon VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permission Group Members
CREATE TABLE IF NOT EXISTS permission_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES permission_groups(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(group_id, permission_id)
);

-- Role Templates (pre-configured roles)
CREATE TABLE IF NOT EXISTS role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Details
  template_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50), -- education, corporate, government
  
  -- Configuration
  permissions UUID[], -- Array of permission IDs
  settings JSONB,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permission Audit Log
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID REFERENCES profiles(id),
  performed_by UUID REFERENCES profiles(id),
  
  -- What
  action VARCHAR(100) NOT NULL, -- grant, revoke, check
  permission_key VARCHAR(100),
  role_id UUID REFERENCES roles(id),
  
  -- Where
  tenant_id UUID REFERENCES lms_organizations(id),
  resource_type VARCHAR(100),
  resource_id UUID,
  
  -- Result
  result VARCHAR(50), -- allowed, denied
  reason TEXT,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_permissions_key ON permissions(permission_key);
CREATE INDEX idx_permissions_category ON permissions(category);

CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_key ON roles(role_key);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_tenant ON user_permissions(tenant_id);

CREATE INDEX idx_permission_audit_user ON permission_audit_log(user_id);
CREATE INDEX idx_permission_audit_created ON permission_audit_log(created_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions
CREATE POLICY permissions_read ON permissions FOR SELECT USING (true);

-- Tenant admins can manage roles
CREATE POLICY roles_admin ON roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = roles.tenant_id
    AND tm.user_id = auth.uid()
    AND tm.tenant_role IN ('owner', 'admin')
  )
);

-- Users can see their own roles
CREATE POLICY user_roles_own ON user_roles FOR SELECT USING (user_id = auth.uid());

-- Users can see their own permissions
CREATE POLICY user_permissions_own ON user_permissions FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission_key VARCHAR,
  p_tenant_id UUID DEFAULT NULL,
  p_scope VARCHAR DEFAULT 'global',
  p_scope_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
BEGIN
  -- Check direct user permissions (highest priority)
  SELECT EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = p_user_id
      AND p.permission_key = p_permission_key
      AND (p_tenant_id IS NULL OR up.tenant_id = p_tenant_id)
      AND up.grant_type = 'allow'
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
      AND (up.scope = p_scope OR up.scope = 'global')
      AND (up.scope_id = p_scope_id OR up.scope_id IS NULL)
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN true;
  END IF;
  
  -- Check if explicitly denied
  SELECT EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = p_user_id
      AND p.permission_key = p_permission_key
      AND (p_tenant_id IS NULL OR up.tenant_id = p_tenant_id)
      AND up.grant_type = 'deny'
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN false;
  END IF;
  
  -- Check role permissions
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.permission_key = p_permission_key
      AND (p_tenant_id IS NULL OR ur.tenant_id = p_tenant_id)
      AND rp.grant_type = 'allow'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND (ur.scope = p_scope OR ur.scope = 'global')
      AND (ur.scope_id = p_scope_id OR ur.scope_id IS NULL)
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_tenant_id UUID DEFAULT NULL
) RETURNS TABLE (
  permission_key VARCHAR,
  permission_name VARCHAR,
  grant_type VARCHAR,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  -- Direct permissions
  SELECT 
    p.permission_key,
    p.permission_name,
    up.grant_type,
    'direct'::VARCHAR as source
  FROM user_permissions up
  JOIN permissions p ON p.id = up.permission_id
  WHERE up.user_id = p_user_id
    AND (p_tenant_id IS NULL OR up.tenant_id = p_tenant_id)
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
  
  UNION
  
  -- Role permissions
  SELECT 
    p.permission_key,
    p.permission_name,
    rp.grant_type,
    'role'::VARCHAR as source
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = p_user_id
    AND (p_tenant_id IS NULL OR ur.tenant_id = p_tenant_id)
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign role to user
CREATE OR REPLACE FUNCTION assign_role(
  p_user_id UUID,
  p_role_id UUID,
  p_tenant_id UUID,
  p_assigned_by UUID,
  p_scope VARCHAR DEFAULT 'global',
  p_scope_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  INSERT INTO user_roles (
    user_id,
    role_id,
    tenant_id,
    scope,
    scope_id,
    expires_at,
    assigned_by
  ) VALUES (
    p_user_id,
    p_role_id,
    p_tenant_id,
    p_scope,
    p_scope_id,
    p_expires_at,
    p_assigned_by
  )
  ON CONFLICT (user_id, role_id, tenant_id, scope, scope_id)
  DO UPDATE SET
    expires_at = p_expires_at,
    assigned_by = p_assigned_by,
    assigned_at = NOW()
  RETURNING id INTO v_assignment_id;
  
  -- Log the assignment
  INSERT INTO permission_audit_log (
    user_id,
    performed_by,
    action,
    role_id,
    tenant_id,
    result
  ) VALUES (
    p_user_id,
    p_assigned_by,
    'assign_role',
    p_role_id,
    p_tenant_id,
    'allowed'
  );
  
  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to user
CREATE OR REPLACE FUNCTION grant_permission(
  p_user_id UUID,
  p_permission_key VARCHAR,
  p_tenant_id UUID,
  p_granted_by UUID,
  p_grant_type VARCHAR DEFAULT 'allow',
  p_scope VARCHAR DEFAULT 'global',
  p_scope_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_permission_id UUID;
  v_grant_id UUID;
BEGIN
  -- Get permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE permission_key = p_permission_key;
  
  IF v_permission_id IS NULL THEN
    RAISE EXCEPTION 'Permission not found: %', p_permission_key;
  END IF;
  
  INSERT INTO user_permissions (
    user_id,
    permission_id,
    tenant_id,
    grant_type,
    scope,
    scope_id,
    expires_at,
    granted_by,
    reason
  ) VALUES (
    p_user_id,
    v_permission_id,
    p_tenant_id,
    p_grant_type,
    p_scope,
    p_scope_id,
    p_expires_at,
    p_granted_by,
    p_reason
  )
  ON CONFLICT (user_id, permission_id, tenant_id, scope, scope_id)
  DO UPDATE SET
    grant_type = p_grant_type,
    expires_at = p_expires_at,
    granted_by = p_granted_by,
    granted_at = NOW(),
    reason = p_reason
  RETURNING id INTO v_grant_id;
  
  -- Log the grant
  INSERT INTO permission_audit_log (
    user_id,
    performed_by,
    action,
    permission_key,
    tenant_id,
    result,
    reason
  ) VALUES (
    p_user_id,
    p_granted_by,
    'grant_permission',
    p_permission_key,
    p_tenant_id,
    'allowed',
    p_reason
  );
  
  RETURN v_grant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA - System Permissions
-- =====================================================

INSERT INTO permissions (permission_name, permission_key, description, category, is_system) VALUES
-- Courses
('View Courses', 'courses:read', 'View course list and details', 'courses', true),
('Create Courses', 'courses:create', 'Create new courses', 'courses', true),
('Edit Courses', 'courses:update', 'Edit existing courses', 'courses', true),
('Delete Courses', 'courses:delete', 'Delete courses', 'courses', true),
('Publish Courses', 'courses:publish', 'Publish courses', 'courses', true),

-- Users
('View Users', 'users:read', 'View user list and profiles', 'users', true),
('Create Users', 'users:create', 'Create new users', 'users', true),
('Edit Users', 'users:update', 'Edit user profiles', 'users', true),
('Delete Users', 'users:delete', 'Delete users', 'users', true),
('Manage Roles', 'users:manage_roles', 'Assign roles to users', 'users', true),

-- Enrollments
('View Enrollments', 'enrollments:read', 'View enrollment data', 'enrollments', true),
('Create Enrollments', 'enrollments:create', 'Enroll users in courses', 'enrollments', true),
('Delete Enrollments', 'enrollments:delete', 'Remove enrollments', 'enrollments', true),

-- Grades
('View Grades', 'grades:read', 'View grades', 'grades', true),
('Edit Grades', 'grades:update', 'Edit grades', 'grades', true),
('Export Grades', 'grades:export', 'Export grade data', 'grades', true),

-- Reports
('View Reports', 'reports:read', 'View reports', 'reports', true),
('Create Reports', 'reports:create', 'Create custom reports', 'reports', true),
('Export Reports', 'reports:export', 'Export report data', 'reports', true),

-- Settings
('View Settings', 'settings:read', 'View system settings', 'settings', true),
('Edit Settings', 'settings:update', 'Edit system settings', 'settings', true),

-- Certificates
('View Certificates', 'certificates:read', 'View certificates', 'certificates', true),
('Issue Certificates', 'certificates:issue', 'Issue certificates', 'certificates', true),
('Revoke Certificates', 'certificates:revoke', 'Revoke certificates', 'certificates', true),

-- Analytics
('View Analytics', 'analytics:read', 'View analytics dashboards', 'analytics', true),
('Export Analytics', 'analytics:export', 'Export analytics data', 'analytics', true)

ON CONFLICT (permission_key) DO NOTHING;

-- =====================================================
-- SEED DATA - System Roles
-- =====================================================

-- Super Admin Role
INSERT INTO roles (role_name, role_key, description, is_system, priority, tenant_id)
SELECT 'Super Admin', 'super_admin', 'Full system access', true, 1000, id
FROM lms_organizations
LIMIT 1
ON CONFLICT DO NOTHING;

-- Admin Role
INSERT INTO roles (role_name, role_key, description, is_system, priority, tenant_id)
SELECT 'Admin', 'admin', 'Administrative access', true, 900, id
FROM lms_organizations
ON CONFLICT DO NOTHING;

-- Instructor Role
INSERT INTO roles (role_name, role_key, description, is_system, priority, tenant_id)
SELECT 'Instructor', 'instructor', 'Course instructor access', true, 500, id
FROM lms_organizations
ON CONFLICT DO NOTHING;

-- Student Role
INSERT INTO roles (role_name, role_key, description, is_system, priority, tenant_id)
SELECT 'Student', 'student', 'Student access', true, 100, id
FROM lms_organizations
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETE
-- =====================================================
