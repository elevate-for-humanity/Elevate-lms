-- Restore the invariant enforced by on_auth_user_created: every auth user has
-- a profile. This is idempotent and uses the same tenant/role rules as
-- public.handle_new_user(), so recovery does not invent a different authority.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE is_platform_owner = true
      AND COALESCE(status, 'active') = 'active'
  ) THEN
    RAISE EXCEPTION 'Cannot repair missing profiles: no active platform-owner tenant';
  END IF;
END
$$;

WITH platform_owner AS (
  SELECT id
  FROM public.tenants
  WHERE is_platform_owner = true
    AND COALESCE(status, 'active') = 'active'
  ORDER BY created_at ASC
  LIMIT 1
), missing_users AS (
  SELECT au.*
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL
), resolved AS (
  SELECT
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.last_sign_in_at,
    COALESCE(metadata_tenant.id, owner.id) AS tenant_id
  FROM missing_users au
  CROSS JOIN platform_owner owner
  LEFT JOIN LATERAL (
    SELECT t.id
    FROM public.tenants t
    WHERE (au.raw_user_meta_data ->> 'tenant_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      AND t.id = (au.raw_user_meta_data ->> 'tenant_id')::uuid
      AND COALESCE(t.status, 'active') = 'active'
    LIMIT 1
  ) metadata_tenant ON true
)
INSERT INTO public.profiles (
  id,
  email,
  role,
  tenant_id,
  full_name,
  last_sign_in_at
)
SELECT
  r.id,
  r.email,
  CASE
    WHEN lower(COALESCE(r.raw_user_meta_data ->> 'role', 'student')) = ANY (
      ARRAY[
        'student','staff','partner','employer','program_holder','instructor',
        'admin','super_admin','apprentice','mentor','case_manager','creator',
        'sponsor','host_shop','guest'
      ]::text[]
    )
      THEN lower(COALESCE(r.raw_user_meta_data ->> 'role', 'student'))
    ELSE 'student'
  END,
  r.tenant_id,
  COALESCE(
    NULLIF(r.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(
      trim(
        COALESCE(r.raw_user_meta_data ->> 'first_name', '') || ' ' ||
        COALESCE(r.raw_user_meta_data ->> 'last_name', '')
      ),
      ''
    )
  ),
  r.last_sign_in_at
FROM resolved r
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Profile recovery incomplete: auth users without profiles remain';
  END IF;
END
$$;
