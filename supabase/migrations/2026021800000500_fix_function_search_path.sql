-- Fix all public functions with mutable search_path.
-- Excludes extension-owned functions (pg_trgm, fuzzystrmatch, etc.)

DO $$
DECLARE
  fn_sig text;
BEGIN
  FOR fn_sig IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (
        p.proconfig IS NULL
        OR NOT (p.proconfig @> ARRAY['search_path=public'])
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid
          AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn_sig);
  END LOOP;
END;
$$;
