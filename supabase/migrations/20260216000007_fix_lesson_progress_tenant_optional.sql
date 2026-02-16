-- Fix: lesson_progress INSERT/UPDATE policies require tenant_id = get_current_tenant_id().
-- If a user has no tenant_id in profiles (e.g. new signup), get_current_tenant_id() returns NULL,
-- and the WITH CHECK fails because NULL = NULL is false in SQL.
--
-- Fix approach: allow INSERT/UPDATE when either:
--   a) tenant_id matches the user's tenant, OR
--   b) user has no tenant assigned yet (get_current_tenant_id() IS NULL)
--
-- Also updates the signup trigger to assign a default tenant_id.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Fix lesson_progress INSERT policy
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_owner_insert ON public.lesson_progress;
CREATE POLICY lp_owner_insert ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      tenant_id = get_current_tenant_id()
      OR get_current_tenant_id() IS NULL
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 2. Fix lesson_progress UPDATE policy
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_owner_update ON public.lesson_progress;
CREATE POLICY lp_owner_update ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      tenant_id = get_current_tenant_id()
      OR get_current_tenant_id() IS NULL
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 3. Fix admin SELECT policy (same tenant_id issue)
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lp_admin_select ON public.lesson_progress;
CREATE POLICY lp_admin_select ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (
    is_admin()
    AND (
      tenant_id = get_current_tenant_id()
      OR is_super_admin()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. Update signup trigger to assign default tenant_id
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_default_tenant uuid;
BEGIN
  -- Get the default tenant (first active tenant, or the only one)
  SELECT id INTO v_default_tenant
  FROM public.tenants
  WHERE active = true
  ORDER BY created_at ASC
  LIMIT 1;

  INSERT INTO public.profiles (id, email, role, tenant_id)
  VALUES (NEW.id, NEW.email, 'student', v_default_tenant);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: create profile without tenant if tenants table doesn't exist
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
