-- Bootstrap missing profile rows for authenticated users who have no profile.
--
-- This happens when handle_new_user trigger fails silently (e.g. tenants table
-- empty, constraint violation) or when users are created via admin API.
--
-- Safe to re-run: INSERT ... ON CONFLICT DO NOTHING.
-- After applying, verify with:
--   SELECT id, email, role FROM auth.users u
--   LEFT JOIN public.profiles p ON p.id = u.id
--   WHERE p.id IS NULL;

-- Step 1: ensure a default tenant exists so the FK constraint on profiles.tenant_id
-- doesn't block the insert (if tenant_id is required).
INSERT INTO public.tenants (id, name, slug, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Elevate for Humanity',
  'elevate-for-humanity',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: insert profile rows for any auth.users who have no profile row.
-- Defaults to role='student'; the UPDATE below promotes known admin emails.
INSERT INTO public.profiles (id, email, role, tenant_id, created_at, updated_at)
SELECT
  u.id,
  u.email,
  'student',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: promote known admin/super_admin emails.
-- Add additional emails here as needed.
UPDATE public.profiles
SET role = 'super_admin', updated_at = NOW()
WHERE email IN (
  'curvaturebodysculpting@gmail.com'
)
AND role != 'super_admin';
