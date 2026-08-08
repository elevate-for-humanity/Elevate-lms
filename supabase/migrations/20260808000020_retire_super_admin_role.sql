-- Retire the legacy super_admin assignment model.
-- The platform now uses `admin` as the single platform-wide privileged role.
-- This migration is idempotent and preserves all user identities.

BEGIN;

-- Primary profile role is the canonical role used throughout auth and routing.
UPDATE public.profiles
SET role = 'admin'
WHERE role = 'super_admin';

-- Migrate secondary multi-role assignments when both canonical role tables exist.
DO $$
DECLARE
  v_admin_role_id uuid;
  v_super_role_id uuid;
BEGIN
  IF to_regclass('public.roles') IS NULL OR to_regclass('public.user_roles') IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;
  SELECT id INTO v_super_role_id FROM public.roles WHERE name = 'super_admin' LIMIT 1;

  IF v_admin_role_id IS NULL OR v_super_role_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role_id)
  SELECT ur.user_id, v_admin_role_id
  FROM public.user_roles ur
  WHERE ur.role_id = v_super_role_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles existing
      WHERE existing.user_id = ur.user_id
        AND existing.role_id = v_admin_role_id
    );

  DELETE FROM public.user_roles
  WHERE role_id = v_super_role_id;
END $$;

COMMIT;
