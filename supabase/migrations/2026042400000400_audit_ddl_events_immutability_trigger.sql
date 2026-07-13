-- Adds immutability protection for public.audit_ddl_events.
--
-- This trigger was defined in 20260228000002_audit_ddl_monitoring.sql but
-- was never applied to the live database. The verify_audit_integrity() RPC
-- reports it as missing, causing the /api/health audit_integrity check to warn.
--
-- Safe to run repeatedly (idempotent via DO block).

-- Function: raise on any UPDATE or DELETE attempt
CREATE OR REPLACE FUNCTION public.prevent_audit_ddl_events_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_ddl_events is immutable: UPDATE and DELETE are not allowed';
END;
$$;

-- Trigger: apply only if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'audit_ddl_events'
      AND t.tgname = 'enforce_ddl_events_immutability'
  ) THEN
    CREATE TRIGGER enforce_ddl_events_immutability
    BEFORE UPDATE OR DELETE ON public.audit_ddl_events
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_ddl_events_mutation();
  END IF;
END $$;
