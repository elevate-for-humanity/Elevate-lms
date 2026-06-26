-- Add 'apprentice' to the allowed roles in profiles table
-- Run this SQL to fix the role constraint

-- First, drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Re-add with apprentice role included
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin', 'super_admin', 'staff', 'instructor', 'employer', 
  'partner', 'student', 'apprentice', 'mentor', 'case_manager',
  'program_holder', 'creator', 'sponsor', 'host_shop', 'guest'
));

-- Update Jordan White to apprentice role
UPDATE profiles SET role = 'apprentice' WHERE email = 'jbwhite888@icloud.com';

-- Also update all active Barber Apprenticeship enrollments to have apprentice role
UPDATE profiles 
SET role = 'apprentice'
WHERE id IN (
  SELECT pe.user_id 
  FROM program_enrollments pe
  JOIN programs p ON p.slug = pe.program_slug
  WHERE pe.enrollment_state = 'active' 
    AND p.title ILIKE '%barber%'
);

-- Verify the fix
SELECT 'Profiles with apprentice role:' as info;
SELECT role, COUNT(*) FROM profiles WHERE role = 'apprentice' GROUP BY role;
