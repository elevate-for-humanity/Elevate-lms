-- 20260629000004_cleanup_intake_timestamp_ids.sql
--
-- Convert legacy applications rows whose id starts with 'intake-' to proper UUIDs.
-- These were created by an old version of /api/intake/route.ts that used
-- `intake-${Date.now()}` as a fallback ID. The bug is fixed — new rows always
-- get UUID ids. But existing rows need their id column updated so the admin
-- review page can load them.
--
-- Strategy: assign gen_random_uuid() to each legacy row, preserving all data.
-- The old intake-{timestamp} id is stored in metadata->>'legacy_id' for tracing.

-- Step 1: preview what will be converted
-- SELECT id, email, program_interest, created_at
-- FROM public.applications
-- WHERE id LIKE 'intake-%'
-- ORDER BY created_at DESC;

-- Step 2: convert ids to real UUIDs, stash old id in metadata.
-- Safety: canonical schema uses UUID ids, which cannot contain intake-* values.
-- Only execute this update when applications.id is text/varchar in a drifted env.
DO $$
DECLARE
  id_data_type text;
BEGIN
  SELECT c.data_type
    INTO id_data_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'applications'
    AND c.column_name = 'id';

  IF id_data_type IN ('text', 'character varying') THEN
    EXECUTE $sql$
      UPDATE public.applications
      SET
        id = gen_random_uuid()::text,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('legacy_id', id)
      WHERE id LIKE 'intake-%'
    $sql$;
    RAISE NOTICE 'Converted legacy intake-* IDs in text/varchar applications.id';
  ELSE
    RAISE NOTICE 'Skipped intake-* cleanup: applications.id is %, not text/varchar', COALESCE(id_data_type, 'unknown');
  END IF;
END $$;

-- Verify (for text/varchar id environments): should return 0 rows after running
-- SELECT id FROM public.applications WHERE id LIKE 'intake-%';
