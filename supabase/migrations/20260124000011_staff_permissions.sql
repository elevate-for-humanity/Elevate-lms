-- Staff permissions table for license holders to grant admin access to their staff
-- Each license holder (tenant) can grant specific permissions to their staff members

CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Admin permissions
  can_access_admin BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_courses BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  can_manage_settings BOOLEAN DEFAULT false,
  
  -- Granted by (the license holder or another admin)
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique permission per user per tenant
  UNIQUE(user_id, tenant_id)
);

-- Enable RLS
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own permissions
DROP POLICY IF EXISTS "Users can view own permissions" ON staff_permissions;
CREATE POLICY "Users can view own permissions"
  ON staff_permissions FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Tenant admins can manage permissions for their tenant
DROP POLICY IF EXISTS "Tenant admins can manage staff permissions" ON staff_permissions;
CREATE POLICY "Tenant admins can manage staff permissions"
  ON staff_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = staff_permissions.tenant_id
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Super admins (platform owner) can manage all permissions
DROP POLICY IF EXISTS "Super admins can manage all permissions" ON staff_permissions;
CREATE POLICY "Super admins can manage all permissions"
  ON staff_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
      AND profiles.tenant_id IS NULL
    )
  );

-- Index for fast lookups
CREATE INDEX idx_staff_permissions_user_tenant ON staff_permissions(user_id, tenant_id);
CREATE INDEX idx_staff_permissions_tenant ON staff_permissions(tenant_id);

-- Add tenant_id to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tenant_id UUID;
  END IF;
END $$;

-- Add onboarding_completed to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    ALTER TABLE profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
  END IF;
END $$;
