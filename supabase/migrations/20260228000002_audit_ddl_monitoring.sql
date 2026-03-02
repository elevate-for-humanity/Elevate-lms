-- DDL monitoring for audit infrastructure.
-- Captures any ALTER TABLE, DROP, DISABLE TRIGGER, or schema changes
-- targeting audit_logs, audit_failures, audit_ddl_events, or their
-- trigger functions. This creates a forensic trace even if someone
-- attempts to disable immutability controls.

-- Immutable DDL event log
CREATE TABLE IF NOT EXISTS public.audit_ddl_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_time timestamptz DEFAULT now() NOT NULL,
  event_tag text NOT NULL,
  object_type text,
  object_identity text,
  command_text text,
  ddl_session_user text DEFAULT session_user,
  ddl_current_user text DEFAULT current_user,
  client_addr text DEFAULT inet_client_addr()::text
);

ALTER TABLE public.audit_ddl_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_ddl_events FORCE ROW LEVEL SECURITY;

REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_ddl_events FROM service_role, anon, authenticated;
REVOKE TRUNCATE ON public.audit_ddl_events FROM postgres;

CREATE TRIGGER enforce_ddl_events_immutability
  BEFORE UPDATE OR DELETE ON public.audit_ddl_events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_tampering();

GRANT INSERT, SELECT ON public.audit_ddl_events TO service_role;

-- Event trigger function: captures DDL on audit infrastructure
CREATE OR REPLACE FUNCTION log_audit_table_ddl()
RETURNS event_trigger AS $t$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF obj.object_identity LIKE '%audit_logs%'
       OR obj.object_identity LIKE '%audit_failures%'
       OR obj.object_identity LIKE '%audit_ddl_events%'
       OR obj.object_identity LIKE '%prevent_audit_tampering%'
       OR obj.object_identity LIKE '%audit_trigger_fn%'
    THEN
      INSERT INTO public.audit_ddl_events (event_tag, object_type, object_identity, command_text)
      VALUES (TG_TAG, obj.object_type, obj.object_identity, current_query());
    END IF;
  END LOOP;
END;
$t$ LANGUAGE plpgsql SECURITY DEFINER;

-- Event trigger: fires on any DDL command completion
CREATE EVENT TRIGGER audit_infrastructure_ddl_monitor
  ON ddl_command_end
  EXECUTE FUNCTION log_audit_table_ddl();
