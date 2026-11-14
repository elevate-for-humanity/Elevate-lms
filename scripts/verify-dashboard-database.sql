-- ============================================================================
-- DASHBOARD DATABASE VERIFICATION SCRIPT
-- ============================================================================
-- Purpose: Verify all tables and columns used by dashboards exist
-- Run this against your Supabase database to check schema completeness
-- ============================================================================

-- Check if profiles table exists and has required columns
\echo 'Checking profiles table columns...'
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN (
      'id', 'email', 'role', 'full_name', 'first_name', 'last_name',
      'verified', 'orientation_completed', 'eligibility_verified', 
      'onboarding_complete', 'phone', 'avatar_url', 'bio',
      'created_at', 'updated_at', 'last_login_at'
    ) THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY 
  CASE 
    WHEN column_name IN (
      'id', 'email', 'role', 'full_name', 'first_name', 'last_name',
      'verified', 'orientation_completed', 'eligibility_verified', 
      'onboarding_complete'
    ) THEN 1
    ELSE 2
  END,
  column_name;

-- Check for missing required columns in profiles
SELECT 
  'Missing profiles columns' as check_type,
  unnest(ARRAY[
    'id', 'email', 'role', 'full_name', 'first_name', 'last_name',
    'verified', 'orientation_completed', 'eligibility_verified', 
    'onboarding_complete', 'phone', 'created_at', 'updated_at'
  ]) as required_column
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = required_column
);

-- Check if enrollments table exists and has required columns
SELECT 
  'enrollments' as table_name,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN (
      'id', 'user_id', 'program_id', 'status', 'at_risk',
      'program_holder_id', 'instructor_id', 'progress_percentage',
      'completion_date', 'created_at', 'updated_at'
    ) THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'enrollments'
ORDER BY 
  CASE 
    WHEN column_name IN (
      'id', 'user_id', 'program_id', 'status', 'at_risk',
      'program_holder_id', 'instructor_id', 'progress_percentage'
    ) THEN 1
    ELSE 2
  END,
  column_name;

-- Check for missing required columns in enrollments
SELECT 
  'Missing enrollments columns' as check_type,
  unnest(ARRAY[
    'id', 'user_id', 'program_id', 'status', 'at_risk',
    'program_holder_id', 'instructor_id', 'progress_percentage',
    'created_at', 'updated_at'
  ]) as required_column
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public'
  AND table_name = 'enrollments'
  AND column_name = required_column
);

-- Check if programs table exists
SELECT 
  'programs' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'programs';

-- Check if course_progress table exists
SELECT 
  'course_progress' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'course_progress';

-- Check if certifications table exists
SELECT 
  'certifications' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'certifications';

-- Check if job_postings table exists
SELECT 
  'job_postings' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'job_postings';

-- Check if job_applications table exists
SELECT 
  'job_applications' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'job_applications';

-- Check if job_placements table exists
SELECT 
  'job_placements' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'job_placements';

-- Check if compliance_reports table exists
SELECT 
  'compliance_reports' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'compliance_reports';

-- Check if compliance_scores table exists
SELECT 
  'compliance_scores' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'compliance_scores';

-- Check if student_verifications table exists
SELECT 
  'student_verifications' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'student_verifications';

-- Check if apprenticeship_programs table exists
SELECT 
  'apprenticeship_programs' as table_name,
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Exists'
    ELSE '❌ Missing'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'apprenticeship_programs';

-- Check role enum values in profiles
SELECT 
  'profiles.role enum values' as check_type,
  enumlabel as role_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = (
  SELECT udt_name 
  FROM information_schema.columns 
  WHERE table_name = 'profiles' 
  AND column_name = 'role'
  AND table_schema = 'public'
)
ORDER BY enumsortorder;

-- Check enrollment status enum values
SELECT 
  'enrollments.status enum values' as check_type,
  enumlabel as status_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = (
  SELECT udt_name 
  FROM information_schema.columns 
  WHERE table_name = 'enrollments' 
  AND column_name = 'status'
  AND table_schema = 'public'
)
ORDER BY enumsortorder;

-- Summary: Tables used by each dashboard
SELECT 
  'Dashboard Database Dependencies' as summary,
  'Student Dashboard' as dashboard,
  'profiles, enrollments, course_progress, certifications, job_placements' as required_tables
UNION ALL
SELECT 
  'Dashboard Database Dependencies',
  'Admin Dashboard',
  'profiles, enrollments, compliance_reports, job_postings, job_placements, programs, compliance_scores'
UNION ALL
SELECT 
  'Dashboard Database Dependencies',
  'Program Holder Dashboard',
  'profiles, enrollments, student_verifications, compliance_reports, compliance_scores'
UNION ALL
SELECT 
  'Dashboard Database Dependencies',
  'Employer Dashboard',
  'profiles, job_postings, job_applications, apprenticeship_programs'
UNION ALL
SELECT 
  'Dashboard Database Dependencies',
  'Staff Dashboard',
  'profiles (needs staff-specific tables)'
UNION ALL
SELECT 
  'Dashboard Database Dependencies',
  'Instructor Dashboard',
  'profiles, enrollments, courses (needs instructor-specific tables)';

-- ============================================================================
-- MIGRATION TEMPLATE FOR MISSING COLUMNS
-- ============================================================================
-- If any columns are missing, use this template to add them:

/*
-- Add missing columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS orientation_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS eligibility_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Add role check constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'student', 'instructor', 'staff', 'admin', 'super_admin', 'org_admin',
  'program_holder', 'partner', 'employer', 'board_member', 
  'workforce_board', 'parent'
));

-- Add missing columns to enrollments
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS at_risk BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS program_holder_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Add status check constraint
ALTER TABLE enrollments 
DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE enrollments 
ADD CONSTRAINT enrollments_status_check 
CHECK (status IN ('pending', 'active', 'completed', 'withdrawn', 'suspended'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_holder_id ON enrollments(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_at_risk ON enrollments(at_risk);
*/
