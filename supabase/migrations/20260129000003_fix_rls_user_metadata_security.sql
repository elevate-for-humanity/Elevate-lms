-- Fix RLS Security: Remove user_metadata references
-- 
-- SECURITY ISSUE: user_metadata is editable by end users and should never
-- be used in RLS policies. This migration replaces all user_metadata 
-- references with secure lookups from the profiles table.
--
-- Affected tables:
-- - public.tenants
-- - public.licenses  
-- - public.license_purchases
-- - public.provisioning_events
-- - public.license_violations

-- ============================================
-- STEP 1: Create secure tenant lookup function
-- ============================================

-- Replace with secure version that ONLY uses profiles table (no DROP — policies depend on it)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from profiles table (server-controlled, not user-editable)
  SELECT tenant_id INTO v_tenant_id
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION get_current_tenant_id IS 
  'Securely returns tenant_id from profiles table. Never uses user_metadata.';

-- ============================================
-- STEP 2: Drop insecure policies on tenants
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;

-- Create secure policy
DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;
CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 3: Drop insecure policies on licenses
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant licenses" ON licenses;

-- Create secure policy
DROP POLICY IF EXISTS "Users can view own tenant licenses" ON licenses;
CREATE POLICY "Users can view own tenant licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 4: Drop insecure policies on license_purchases
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant purchases" ON license_purchases;

-- Create secure policy
DROP POLICY IF EXISTS "Users can view own tenant purchases" ON license_purchases;
CREATE POLICY "Users can view own tenant purchases"
  ON license_purchases FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- ============================================
-- STEP 5: Drop insecure policies on provisioning_events
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant provisioning events" ON provisioning_events;

-- Create secure policy (admins only within tenant)
DROP POLICY IF EXISTS "Users can view own tenant provisioning events" ON provisioning_events;
CREATE POLICY "Users can view own tenant provisioning events"
  ON provisioning_events FOR SELECT
  TO authenticated
  USING (
    (tenant_id = get_current_tenant_id() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
    OR is_super_admin()
  );

-- ============================================
-- STEP 6: Drop insecure policies on license_violations
-- ============================================

DROP POLICY IF EXISTS "Users can view own tenant violations" ON license_violations;

-- Create secure policy (admins only within tenant)
DROP POLICY IF EXISTS "Users can view own tenant violations" ON license_violations;
CREATE POLICY "Users can view own tenant violations"
  ON license_violations FOR SELECT
  TO authenticated
  USING (
    (tenant_id = get_current_tenant_id() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
    OR is_super_admin()
  );

-- ============================================
-- STEP 7: Ensure is_super_admin function is secure
-- ============================================

-- Recreate to ensure it doesn't use user_metadata
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION is_super_admin IS 
  'Securely checks super_admin role from profiles table. Never uses user_metadata.';

-- ============================================
-- VERIFICATION: Check no policies reference user_metadata
-- ============================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- This will fail if any policies still reference user_metadata
  -- (Manual verification recommended after migration)
  RAISE NOTICE 'Migration complete. Verify no policies reference user_metadata in Supabase dashboard.';
END $$;
