-- Set super_admin role for the primary admin account.
-- Run in Supabase Dashboard → SQL Editor.

UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'Elevate4humanityedu@gmail.com';

-- Verify
SELECT id, email, role FROM public.profiles
WHERE email = 'Elevate4humanityedu@gmail.com';
