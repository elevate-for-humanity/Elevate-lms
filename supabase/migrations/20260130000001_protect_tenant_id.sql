-- 20260130_protect_tenant_id.sql
-- Purpose:
-- 1) Provide a SECURITY DEFINER tenant lookup helper (get_current_tenant_id)
-- 2) Lock down profiles.tenant_id so users cannot change their tenant
-- 3) Provide a defense-in-depth trigger that prevents tenant_id changes even if a policy is misconfigured
--
-- Assumptions:
-- - public.profiles exists with columns: id (uuid), tenant_id (uuid)
-- - auth.uid() is available (Supabase)
-- - You may already have is_super_admin() in public. If not, see the note at the bottom.

BEGIN;

-- 1) Tenant lookup helper
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT p.tenant_id
    INTO v_tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  RETURN v_tenant_id;
END;
$$;

-- Make sure only intended roles can EXECUTE this function.
-- (authenticated is a Postgres role Supabase uses; adjust if your project differs.)
REVOKE ALL ON FUNCTION public.get_current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;

-- 2) Defense-in-depth trigger function
-- Blocks tenant_id changes for non-super-admins.
CREATE OR REPLACE FUNCTION public.prevent_tenant_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if no change
  IF NEW.tenant_id IS NOT DISTINCT FROM OLD.tenant_id THEN
    RETURN NEW;
  END IF;

  -- Allow super admins (assumes public.is_super_admin() exists)
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  -- Otherwise block any tenant_id mutation
  RAISE EXCEPTION 'tenant_id cannot be changed'
    USING ERRCODE = '42501'; -- insufficient_privilege
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_tenant_id_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_tenant_id_change() TO authenticated;

-- 3) Trigger to enforce tenant_id immutability
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'protect_tenant_id'
  ) THEN
    EXECUTE 'DROP TRIGGER protect_tenant_id ON public.profiles';
  END IF;
END
$$;

CREATE TRIGGER protect_tenant_id
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_tenant_id_change();

-- 4) RLS policy defense-in-depth (prevents UPDATE that attempts tenant_id change)
-- IMPORTANT: This policy only matters if RLS is enabled on profiles and users can UPDATE profiles.
-- It ensures a user can update their own row but cannot change tenant_id.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy to avoid duplicates/name conflicts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'profiles_update_own_row_tenant_immutable'
  ) THEN
    EXECUTE 'DROP POLICY "profiles_update_own_row_tenant_immutable" ON public.profiles';
  END IF;
END
$$;

DROP POLICY IF EXISTS "profiles_update_own_row_tenant_immutable" ON public.profiles;
CREATE POLICY "profiles_update_own_row_tenant_immutable"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR public.is_super_admin()
)
WITH CHECK (
  -- must be your row unless you're super admin
  (auth.uid() = id OR public.is_super_admin())
  AND
  (
    -- tenant_id must remain unchanged unless super admin
    public.is_super_admin()
    OR tenant_id = (SELECT p2.tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid())
  )
);

COMMIT;

-- NOTE:
-- If you also need the licenses SELECT policy referenced in your summary, paste/run this too:
-- (Only if it doesn't already exist)
-- CREATE POLICY "Users can view own tenant licenses"
--   ON public.licenses
--   FOR SELECT
--   TO authenticated
--   USING (tenant_id = public.get_current_tenant_id() OR public.is_super_admin());
