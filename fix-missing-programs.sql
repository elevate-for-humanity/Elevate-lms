-- ============================================================
-- FIX: Missing Programs / 404 Pages
-- Run this in Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql
-- ============================================================

-- Step 1: Show current state of programs
SELECT 
    status,
    published,
    is_active,
    COUNT(*) as count
FROM programs
GROUP BY status, published, is_active
ORDER BY status;

-- Step 2: Fix - Publish all non-archived programs
-- This ensures programs appear on the public catalog
UPDATE programs
SET 
    published = true,
    is_active = true,
    status = 'active',
    updated_at = NOW()
WHERE status != 'archived'
  AND (published = false OR is_active = false OR status != 'active');

-- Step 3: Verify the fix
SELECT 
    slug,
    title,
    published,
    is_active,
    status
FROM programs
WHERE status = 'archived'
   OR published = false
   OR is_active = false
ORDER BY title;

-- Step 4: Confirm visible programs
SELECT COUNT(*) as visible_programs
FROM programs
WHERE published = true AND is_active = true AND status = 'active';
