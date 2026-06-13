-- Remove 'superuser' value if it exists in profiles.role enum
-- 'super_admin' is kept; 'superuser' is a typo that should not exist
-- Also update any existing profiles with 'superuser' role to 'super_admin'

BEGIN;

-- Update profiles with 'superuser' role to 'super_admin'
UPDATE profiles SET role = 'super_admin' WHERE role = 'superuser';

DO $$
BEGIN
  -- Try to drop superuser value if it exists
  EXECUTE format('ALTER TYPE user_role_enum DROP VALUE IF EXISTS ''superuser''');
EXCEPTION WHEN OTHERS THEN
  -- Value doesn't exist or can't be dropped - that's fine
  RAISE NOTICE 'Could not drop superuser value: %', SQLERRM;
END
$$;

COMMIT;
