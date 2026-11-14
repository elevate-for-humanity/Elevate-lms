-- Check which enrollments table actually exists in the database

-- Check for program_enrollments
SELECT 
  'program_enrollments' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'program_enrollments'
  ) as exists;

-- Check for enrollments
SELECT 
  'enrollments' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'enrollments'
  ) as exists;

-- If program_enrollments exists, show its columns
SELECT 
  'program_enrollments columns' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'program_enrollments'
ORDER BY ordinal_position;

-- If enrollments exists, show its columns
SELECT 
  'enrollments columns' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- Show row counts
SELECT 
  'program_enrollments' as table_name,
  COUNT(*) as row_count
FROM program_enrollments;

SELECT 
  'enrollments' as table_name,
  COUNT(*) as row_count
FROM enrollments;
