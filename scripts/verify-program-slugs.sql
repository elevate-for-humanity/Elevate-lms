-- Post-deploy verification: run in Supabase SQL Editor
-- Checks for legacy slugs that should have been migrated to canonical forms.

-- 1. Known legacy slugs that now redirect — should return 0 rows
SELECT id, slug, name, status
FROM programs
WHERE slug IN (
  'cpr-first-aid-hsi',
  'cdl',
  'cdl-class-a',
  'forklift',
  'tax-entrepreneurship',
  'phlebotomy-technician',
  'certified-nursing-assistant',
  'medical-coding-billing',
  'cosmetology',
  'cna-certification'
);

-- 2. CPR-related rows — verify canonical slug is 'cpr-first-aid'
SELECT id, slug, name, status
FROM programs
WHERE slug ILIKE '%cpr%' OR name ILIKE '%cpr%' OR name ILIKE '%first aid%';

-- 3. All active program slugs — compare against dedicated page list
SELECT slug, name, status
FROM programs
WHERE status = 'active'
ORDER BY slug;
