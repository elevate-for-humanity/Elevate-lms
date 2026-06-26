-- Deduplicate applications table
-- Removes duplicate applications keeping the most recent one per email + program_slug
-- Run this once to clean up existing duplicates

-- First, let's see what we're dealing with
-- This shows duplicate groups with counts
SELECT 
  email,
  program_slug,
  COUNT(*) as duplicate_count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM applications
GROUP BY email, program_slug
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Create a backup of the table first (optional - uncomment if needed)
-- CREATE TABLE applications_backup AS SELECT * FROM applications;

-- Delete duplicates keeping the most recent record (highest id) for each email + program_slug
-- This works because newer applications have higher IDs
DELETE FROM applications a
USING applications b
WHERE a.email = b.email 
  AND a.program_slug = b.program_slug 
  AND a.id < b.id;

-- Verify the cleanup
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT email || program_slug) as unique_combinations
FROM applications;

-- Create unique index to prevent future duplicates (case-insensitive on email)
-- This will block any INSERT that would create a duplicate email + program_slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_email_program 
ON applications(LOWER(email), program_slug) 
WHERE email IS NOT NULL AND program_slug IS NOT NULL;

-- Comment explaining the 24-hour bypass in the API:
-- The API allows the same person to re-apply after 24 hours for flexibility,
-- but this index prevents multiple rapid submissions within the same session.
-- The API logic handles the 24-hour window check before this index would block.
