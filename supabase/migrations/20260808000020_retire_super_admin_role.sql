-- Retire the legacy super_admin assignment model.
-- The platform now uses `admin` as the single platform-wide privileged role.
-- This migration is idempotent and preserves all user identities.

BEGIN;

UPDATE public.profiles
SET role = 'admin'
WHERE role = 'super_admin';

DO $$
BEGIN
  IF to_regclass('public.roles') IS NULL OR to_regclass('public.user_roles') IS NULL THEN
    RETURN;
  END IF;

  -- Copy each legacy secondary assignment to the canonical admin role without
  -- assuming the underlying role-id data type.
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT ur.user_id, admin_role.id
  FROM public.user_roles ur
  JOIN public.roles legacy_role ON legacy_role.id = ur.role_id AND legacy_role.name = 'super_admin'
  CROSS JOIN LATERAL (
    SELECT id
    FROM public.roles
    WHERE name = 'admin'
    LIMIT 1
  ) admin_role
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_roles existing
    WHERE existing.user_id = ur.user_id
      AND existing.role_id = admin_role.id
  );

  DELETE FROM public.user_roles ur
  USING public.roles legacy_role
  WHERE ur.role_id = legacy_role.id
    AND legacy_role.name = 'super_admin';
END $$;

COMMIT;
