-- Fix infinite recursion in partner_users RLS policy
-- The get_current_tenant_id() function queries partner_users,
-- but partner_users has an RLS policy that calls get_current_tenant_id(),
-- creating infinite recursion for authenticated users.
--
-- Solution: Replace the get_current_tenant_id() function with SECURITY DEFINER
-- so it bypasses RLS when looking up the user's tenant.

-- Step 1: Drop and recreate get_current_tenant_id as SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id
  FROM partner_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Step 2: Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO anon;
