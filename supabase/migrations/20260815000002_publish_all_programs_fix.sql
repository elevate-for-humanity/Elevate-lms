-- Migration: Fix Missing Pages - Publish All Active Programs
-- Problem: Programs return 404 because published=false, is_active=false, or status='archived'
-- Solution: Ensure all non-archived programs are published and active for public visibility
-- Date: 2026-06-26

BEGIN;

-- Step 1: Show what will be changed (for documentation/review)
-- This is a SELECT that shows programs that will be affected
DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Count programs that will be updated
    SELECT COUNT(*) INTO affected_count
    FROM programs
    WHERE status != 'archived'
      AND (published = false OR is_active = false OR status != 'active');
    
    RAISE NOTICE 'Programs to be published and activated: %', affected_count;
END $$;

-- Step 2: Publish all non-archived programs
-- This makes them visible on the public catalog
UPDATE programs
SET 
    published = true,
    is_active = true,
    status = 'active',
    updated_at = NOW()
WHERE status != 'archived'
  AND (published = false OR is_active = false OR status != 'active');

-- Step 3: Verify the fix worked
-- Count programs that should now be visible
DO $$
DECLARE
    visible_count INTEGER;
    hidden_count INTEGER;
BEGIN
    -- Count programs that should now be visible
    SELECT COUNT(*) INTO visible_count
    FROM programs
    WHERE published = true AND is_active = true AND status = 'active';
    
    -- Count programs that remain hidden (archived only)
    SELECT COUNT(*) INTO hidden_count
    FROM programs
    WHERE status = 'archived';
    
    RAISE NOTICE 'Programs now visible (published=true, is_active=true, status=active): %', visible_count;
    RAISE NOTICE 'Programs remaining hidden (archived): %', hidden_count;
END $$;

-- Step 4: Create a log entry for audit trail
CREATE TABLE IF NOT EXISTS migration_log (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    details JSONB
);

INSERT INTO migration_log (migration_name, details)
VALUES (
    '20260815000002_publish_all_programs_fix',
    jsonb_build_object(
        'description', 'Publish all non-archived programs to fix 404 pages',
        'tables_affected', ARRAY['programs'],
        'columns_affected', ARRAY['published', 'is_active', 'status', 'updated_at']
    )
);

COMMIT;

-- Final verification query (run separately if needed):
-- SELECT slug, title, published, is_active, status 
-- FROM programs 
-- ORDER BY status, title;
