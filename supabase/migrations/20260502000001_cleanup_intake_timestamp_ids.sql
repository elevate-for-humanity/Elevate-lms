-- Remove legacy intake-{timestamp} rows from the applications table.
-- These rows were created before the intake mirror was fixed and have
-- non-UUID primary keys that break the admin review page.
-- The source data is preserved in the apprenticeship_intake table.
--
-- Safe to run multiple times (DELETE WHERE is idempotent).
-- Run in Supabase Dashboard → SQL Editor before deploying the UUID guard fixes.

DELETE FROM public.applications
WHERE id::text LIKE 'intake-%';
