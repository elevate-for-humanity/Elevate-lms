-- Creates the verify_audit_integrity() RPC called by /api/health.
-- Returns a JSON object with:
--   disabled_triggers: count of disabled immutability triggers on audit tables
--   missing_immutability: array of audit table names missing their immutability trigger

CREATE OR REPLACE FUNCTION public.verify_audit_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_tables text[] := ARRAY['audit_logs', 'audit_failures', 'audit_ddl_events'];
  tbl text;
  missing text[] := '{}';
  disabled_count int := 0;
  trigger_name text;
  trigger_enabled char;
BEGIN
  FOREACH tbl IN ARRAY audit_tables LOOP
    -- Check if an immutability trigger exists on this table
    SELECT t.tgname, CASE WHEN t.tgenabled = 'D' THEN 'D' ELSE 'E' END
    INTO trigger_name, trigger_enabled
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = tbl
      AND (t.tgname ILIKE '%immut%' OR t.tgname ILIKE '%readonly%' OR t.tgname ILIKE '%protect%')
    LIMIT 1;

    IF trigger_name IS NULL THEN
      missing := array_append(missing, tbl);
    ELSIF trigger_enabled = 'D' THEN
      disabled_count := disabled_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'disabled_triggers',     disabled_count,
    'missing_immutability',  to_jsonb(missing)
  );
END;
$$;

-- Only service_role (used by admin client in health check) can call this
REVOKE ALL ON FUNCTION public.verify_audit_integrity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_audit_integrity() TO service_role;
