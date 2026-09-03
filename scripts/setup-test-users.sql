-- Setup Test Users for Functional Testing
-- Run this in Supabase SQL Editor

-- NOTE: You need to create auth users first via Supabase Auth UI or API
-- Then run this to set up their profiles with correct roles

-- After creating users in Auth, get their IDs and update below:

-- Example: Create profiles for test users
-- Replace the UUIDs with actual user IDs from auth.users

/*
-- 1. First create users in Supabase Auth Dashboard:
--    - test-admin@elevate.test (password: TestAdmin123!)
--    - test-staff@elevate.test (password: TestStaff123!)
--    - test-student@elevate.test (password: TestStudent123!)
--    - test-employer@elevate.test (password: TestEmployer123!)

-- 2. Then get their IDs from auth.users:
SELECT id, email FROM auth.users WHERE email LIKE '%@elevate.test';

-- 3. Insert profiles with correct roles:
*/

-- Create test admin profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual auth user ID
  'test-admin@elevate.test',
  'Test Admin',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Create test staff profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002', -- Replace with actual auth user ID
  'test-staff@elevate.test',
  'Test Staff',
  'staff',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'staff', updated_at = NOW();

-- Create test student profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003', -- Replace with actual auth user ID
  'test-student@elevate.test',
  'Test Student',
  'student',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'student', updated_at = NOW();

-- Create test employer profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004', -- Replace with actual auth user ID
  'test-employer@elevate.test',
  'Test Employer',
  'employer',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'employer', updated_at = NOW();

-- Verify profiles
SELECT id, email, full_name, role FROM public.profiles WHERE email LIKE '%@elevate.test';

-- ============================================================================
-- SEED TEST DATA
-- ============================================================================

-- Create test program if not exists
INSERT INTO public.programs (id, title, slug, description, duration, status, created_at)
VALUES (
  'test-program-001',
  'Test Healthcare Program',
  'test-healthcare',
  'Test program for functional testing',
  '8 weeks',
  'active',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test course if not exists
INSERT INTO public.courses (id, title, slug, description, program_id, status, created_at)
VALUES (
  'test-course-001',
  'Test CNA Course',
  'test-cna',
  'Test course for functional testing',
  'test-program-001',
  'published',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test product if not exists
INSERT INTO public.products (id, name, slug, description, price, status, created_at)
VALUES (
  'test-product-001',
  'Test Study Guide',
  'test-study-guide',
  'Test product for functional testing',
  29.99,
  'active',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify test data
SELECT 'programs' as table_name, COUNT(*) as count FROM public.programs WHERE id LIKE 'test-%'
UNION ALL
SELECT 'courses', COUNT(*) FROM public.courses WHERE id LIKE 'test-%'
UNION ALL
SELECT 'products', COUNT(*) FROM public.products WHERE id LIKE 'test-%';
