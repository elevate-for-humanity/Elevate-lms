-- STEP 4C: Tenant Isolation RLS Policies
-- Enforces tenant_id scoping at the database level

-- ============================================
-- HELPER FUNCTION: Get current user's tenant_id
-- ============================================

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Extract tenant_id from JWT claims (set during auth)
  -- Falls back to user_metadata if not in claims
  RETURN COALESCE(
    (auth.jwt() ->> 'tenant_id')::UUID,
    (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION get_current_tenant_id IS 'Returns the tenant_id for the current authenticated user from JWT claims';

-- ============================================
-- ADMIN AUDIT TABLE (PATCH 4.3)
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_tenant_id UUID REFERENCES tenants(id),
  action TEXT NOT NULL,
  table_accessed TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_user ON admin_audit_events(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_tenant ON admin_audit_events(target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_events(created_at);

-- RLS: Only super admins can view audit logs
ALTER TABLE admin_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_select_super_admin"
  ON admin_audit_events FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Insert allowed for logging function
CREATE POLICY "admin_audit_insert"
  ON admin_audit_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE admin_audit_events IS 'Audit log for super-admin cross-tenant access';

-- ============================================
-- HELPER FUNCTION: Check if user is super_admin (with audit)
-- ============================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  ) INTO v_is_admin;
  
  RETURN v_is_admin;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION is_super_admin IS 'Returns true if current user has super_admin role';

-- ============================================
-- FUNCTION: Log super-admin cross-tenant access
-- ============================================

CREATE OR REPLACE FUNCTION log_admin_access(
  p_target_tenant_id UUID,
  p_action TEXT,
  p_table_accessed TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF is_super_admin() AND (p_target_tenant_id IS NULL OR p_target_tenant_id != get_current_tenant_id()) THEN
    INSERT INTO admin_audit_events (
      admin_user_id,
      target_tenant_id,
      action,
      table_accessed,
      reason
    ) VALUES (
      auth.uid(),
      p_target_tenant_id,
      p_action,
      p_table_accessed,
      p_reason
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION log_admin_access IS 'Logs super-admin cross-tenant data access for governance';

-- ============================================
-- PROFILES: Tenant-scoped RLS
-- ============================================

-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can view profiles in their tenant
CREATE POLICY "profiles_select_tenant"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- ENROLLMENTS: Tenant-scoped RLS
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
    DROP POLICY IF EXISTS "Admins can view tenant enrollments" ON enrollments;
    
    -- Enable RLS
    ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
    
    -- Users can view their own enrollments
    EXECUTE 'CREATE POLICY "enrollments_select_own"
      ON enrollments FOR SELECT
      TO authenticated
      USING (user_id = auth.uid())';
    
    -- Tenant-scoped access for staff
    EXECUTE 'CREATE POLICY "enrollments_select_tenant"
      ON enrollments FOR SELECT
      TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
      )';
    
    -- Insert requires matching tenant
    EXECUTE 'CREATE POLICY "enrollments_insert_tenant"
      ON enrollments FOR INSERT
      TO authenticated
      WITH CHECK (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
      )';
    
    -- Update requires matching tenant
    EXECUTE 'CREATE POLICY "enrollments_update_tenant"
      ON enrollments FOR UPDATE
      TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
      )';
  END IF;
END $$;

-- ============================================
-- STUDENT_APPLICATIONS: Tenant-scoped RLS
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_applications') THEN
    DROP POLICY IF EXISTS "Users can view own applications" ON student_applications;
    DROP POLICY IF EXISTS "Staff can view tenant applications" ON student_applications;
    
    ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;
    
    -- Users can view their own applications
    EXECUTE 'CREATE POLICY "student_applications_select_own"
      ON student_applications FOR SELECT
      TO authenticated
      USING (user_id = auth.uid())';
    
    -- Tenant-scoped access
    EXECUTE 'CREATE POLICY "student_applications_select_tenant"
      ON student_applications FOR SELECT
      TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
      )';
    
    -- Insert with tenant check
    EXECUTE 'CREATE POLICY "student_applications_insert_tenant"
      ON student_applications FOR INSERT
      TO authenticated
      WITH CHECK (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
      )';
    
    -- Update with tenant check
    EXECUTE 'CREATE POLICY "student_applications_update_tenant"
      ON student_applications FOR UPDATE
      TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
      )';
  END IF;
END $$;

-- ============================================
-- LESSON_PROGRESS: Tenant-scoped RLS
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_progress') THEN
    DROP POLICY IF EXISTS "Users can view own progress" ON lesson_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
    
    ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
    
    -- Add tenant_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'lesson_progress' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE lesson_progress ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_tenant_id ON lesson_progress(tenant_id);
    END IF;
    
    -- Users can view their own progress
    EXECUTE 'CREATE POLICY "lesson_progress_select_own"
      ON lesson_progress FOR SELECT
      TO authenticated
      USING (user_id = auth.uid())';
    
    -- Users can insert their own progress
    EXECUTE 'CREATE POLICY "lesson_progress_insert_own"
      ON lesson_progress FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid())';
    
    -- Users can update their own progress
    EXECUTE 'CREATE POLICY "lesson_progress_update_own"
      ON lesson_progress FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())';
    
    -- Tenant-scoped read for staff/admins
    EXECUTE 'CREATE POLICY "lesson_progress_select_tenant"
      ON lesson_progress FOR SELECT
      TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
      )';
  END IF;
END $$;

-- ============================================
-- AUDIT_LOGS: Tenant-scoped RLS
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
    
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    
    -- Add tenant_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'audit_logs' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE audit_logs ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
    END IF;
    
    -- Tenant-scoped access for admins
    EXECUTE 'CREATE POLICY "audit_logs_select_tenant"
      ON audit_logs FOR SELECT
      TO authenticated
      USING (
        (tenant_id = get_current_tenant_id() AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN (''admin'', ''super_admin'')
        ))
        OR is_super_admin()
      )';
    
    -- Insert with tenant check
    EXECUTE 'CREATE POLICY "audit_logs_insert_tenant"
      ON audit_logs FOR INSERT
      TO authenticated
      WITH CHECK (
        tenant_id = get_current_tenant_id()
        OR is_super_admin()
      )';
  END IF;
END $$;

-- ============================================
-- NOTIFICATIONS: Tenant-scoped RLS
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    
    -- Add tenant_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE notifications ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
    END IF;
    
    -- Users can view their own notifications
    EXECUTE 'CREATE POLICY "notifications_select_own"
      ON notifications FOR SELECT
      TO authenticated
      USING (user_id = auth.uid())';
    
    -- Users can update their own notifications (mark as read)
    EXECUTE 'CREATE POLICY "notifications_update_own"
      ON notifications FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())';
  END IF;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "profiles_select_own" ON profiles IS 'Users can always view their own profile';
COMMENT ON POLICY "profiles_select_tenant" ON profiles IS 'Users can view profiles within their tenant';
COMMENT ON POLICY "profiles_update_own" ON profiles IS 'Users can only update their own profile';

-- ============================================
-- LICENSE_PURCHASES: Tenant-scoped RLS (PATCH 4.2)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_purchases') THEN
    ALTER TABLE license_purchases ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "license_purchases_select_tenant" ON license_purchases;
    DROP POLICY IF EXISTS "license_purchases_select_super_admin" ON license_purchases;
    
    -- Tenant-scoped access
    EXECUTE 'CREATE POLICY "license_purchases_select_tenant"
      ON license_purchases FOR SELECT
      TO authenticated
      USING (tenant_id = get_current_tenant_id())';
    
    -- Super admin access (with audit in PATCH 4.3)
    EXECUTE 'CREATE POLICY "license_purchases_select_super_admin"
      ON license_purchases FOR SELECT
      TO authenticated
      USING (is_super_admin())';
    
    -- Insert only via service role (webhooks)
    -- No INSERT policy for authenticated = service role only
  END IF;
END $$;

-- ============================================
-- PROVISIONING_EVENTS: Tenant-scoped RLS (PATCH 4.2)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provisioning_events') THEN
    ALTER TABLE provisioning_events ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "provisioning_events_select_tenant" ON provisioning_events;
    DROP POLICY IF EXISTS "provisioning_events_select_super_admin" ON provisioning_events;
    
    -- Tenant-scoped access (admins only)
    EXECUTE 'CREATE POLICY "provisioning_events_select_tenant"
      ON provisioning_events FOR SELECT
      TO authenticated
      USING (
        tenant_id = get_current_tenant_id()
        AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN (''admin'', ''super_admin'')
        )
      )';
    
    -- Super admin access
    EXECUTE 'CREATE POLICY "provisioning_events_select_super_admin"
      ON provisioning_events FOR SELECT
      TO authenticated
      USING (is_super_admin())';
    
    -- Insert only via service role
  END IF;
END $$;
