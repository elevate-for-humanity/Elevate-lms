-- ============================================================================
-- SECURE APPLICATIONS TABLE POLICIES
-- ============================================================================
-- Remove risky public admin policies and ensure proper RLS
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all existing policies on applications table
-- ============================================================================

-- Drop the blocking deny_all policies (these prevent everything)
DROP POLICY IF EXISTS "deny_all" ON public.applications;
DROP POLICY IF EXISTS "deny_all_applications" ON public.applications;

-- Drop existing working policies (we'll recreate them cleanly)
DROP POLICY IF EXISTS "anyone_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "admins_read_applications" ON public.applications;
DROP POLICY IF EXISTS "admins_update_applications" ON public.applications;

-- Drop any other potential duplicates
DROP POLICY IF EXISTS "admins can view applications" ON public.applications;
DROP POLICY IF EXISTS "admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "admins can delete applications" ON public.applications;
DROP POLICY IF EXISTS "admins can insert applications" ON public.applications;
DROP POLICY IF EXISTS "admins_view_applications" ON public.applications;
DROP POLICY IF EXISTS "admins_delete_applications" ON public.applications;
DROP POLICY IF EXISTS "admins_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "anon_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "anon_can_insert_applications" ON public.applications;
DROP POLICY IF EXISTS "authenticated_admins_can_select_applications" ON public.applications;
DROP POLICY IF EXISTS "authenticated_admins_can_update_applications" ON public.applications;
DROP POLICY IF EXISTS "authenticated_admins_can_delete_applications" ON public.applications;

-- ============================================================================
-- STEP 2: Create clean, secure policies
-- ============================================================================

-- Policy 1: Anonymous users can INSERT applications (public form submission)
CREATE POLICY "anon_can_insert_applications"
  ON public.applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 2: Authenticated admins can SELECT applications
CREATE POLICY "authenticated_admins_can_select_applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Policy 3: Authenticated admins can UPDATE applications
CREATE POLICY "authenticated_admins_can_update_applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Policy 4: Authenticated admins can DELETE applications
CREATE POLICY "authenticated_admins_can_delete_applications"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- STEP 3: Verify RLS is enabled
-- ============================================================================

-- Ensure RLS is enabled on applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Verification query
-- ============================================================================

-- Check current policies
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'applications';
  
  RAISE NOTICE '=== Applications Table Policies ===';
  RAISE NOTICE 'Total policies: %', v_policy_count;
  RAISE NOTICE 'Expected: 4 policies (1 INSERT for anon, 3 for authenticated admins)';
END $$;

-- List all policies
SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'applications'
ORDER BY policyname;

-- ============================================================================
-- DONE
-- ============================================================================

COMMENT ON TABLE public.applications IS 'Student applications - RLS enabled. Anon can INSERT, admins can manage.';
