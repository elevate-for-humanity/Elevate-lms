-- Simple Dashboard Schema Verification
-- Run this to check if required columns exist

-- Check profiles table columns
SELECT 
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY column_name;

-- Check enrollments table columns
SELECT 
  'enrollments' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'enrollments'
ORDER BY column_name;

-- Check which required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'profiles', 'enrollments', 'programs', 'course_progress',
      'certifications', 'job_postings', 'job_applications', 
      'job_placements', 'compliance_reports', 'compliance_scores',
      'student_verifications', 'apprenticeship_programs'
    ) THEN 'Required for dashboards'
    ELSE 'Other'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles', 'enrollments', 'programs', 'course_progress',
  'certifications', 'job_postings', 'job_applications', 
  'job_placements', 'compliance_reports', 'compliance_scores',
  'student_verifications', 'apprenticeship_programs'
)
ORDER BY table_name;
