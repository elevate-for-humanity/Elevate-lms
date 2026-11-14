-- Orphan detection query for pre-auth tables.
--
-- Run this in Supabase Dashboard → SQL Editor before any deploy that
-- touches public form routes or auth handlers.
--
-- Expected result: every count = 0.
-- Any count > 0 means rows exist that cannot be reached by an authenticated
-- user. Investigate before shipping.
--
-- Tables covered = PRE_AUTH_TABLES in lib/pre-auth-tables.ts.
-- If you add a table to that registry, add it here too.

SELECT
  table_name,
  orphaned_rows,
  linkable_rows,
  CASE
    WHEN linkable_rows > 0 THEN 'ACTION REQUIRED — run reconcilePreAuthRows or backfill manually'
    WHEN orphaned_rows > 0 THEN 'REVIEW — orphaned rows exist but no matching profile (user not yet registered)'
    ELSE 'OK'
  END AS status
FROM (

  -- program_enrollments
  SELECT
    'program_enrollments' AS table_name,
    COUNT(*) FILTER (WHERE pe.user_id IS NULL) AS orphaned_rows,
    COUNT(*) FILTER (WHERE pe.user_id IS NULL AND p.id IS NOT NULL) AS linkable_rows
  FROM program_enrollments pe
  LEFT JOIN profiles p ON LOWER(p.email) = LOWER(pe.email)

  UNION ALL

  -- applications
  SELECT
    'applications' AS table_name,
    COUNT(*) FILTER (WHERE a.user_id IS NULL) AS orphaned_rows,
    COUNT(*) FILTER (WHERE a.user_id IS NULL AND p.id IS NOT NULL) AS linkable_rows
  FROM applications a
  LEFT JOIN profiles p ON LOWER(p.email) = LOWER(a.email)

  UNION ALL

  -- barber_subscriptions
  SELECT
    'barber_subscriptions' AS table_name,
    COUNT(*) FILTER (WHERE bs.user_id IS NULL) AS orphaned_rows,
    COUNT(*) FILTER (WHERE bs.user_id IS NULL AND p.id IS NOT NULL) AS linkable_rows
  FROM barber_subscriptions bs
  LEFT JOIN profiles p ON LOWER(p.email) = LOWER(bs.customer_email)

) t
ORDER BY linkable_rows DESC, orphaned_rows DESC;
