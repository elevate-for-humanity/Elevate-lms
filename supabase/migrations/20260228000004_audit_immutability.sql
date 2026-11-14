-- Tamper-resistance controls for audit tables.
-- Audit records are append-only: no role can UPDATE, DELETE, or TRUNCATE.
--
-- Defense layers:
-- 1. REVOKE grants from service_role, anon, authenticated
-- 2. BEFORE UPDATE/DELETE trigger raises exception (catches postgres/superuser)
-- 3. FORCE ROW LEVEL SECURITY on table owner

-- Revoke destructive grants
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_failures FROM service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_failures FROM anon, authenticated;

-- Immutability trigger function
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $t$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE: audit records cannot be modified or deleted. Table: %, Operation: %',
    TG_TABLE_NAME, TG_OP;
  RETURN NULL;
END;
$t$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to audit_logs
DROP TRIGGER IF EXISTS enforce_audit_log_immutability ON public.audit_logs;
CREATE TRIGGER enforce_audit_log_immutability
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_tampering();

-- Apply to audit_failures
DROP TRIGGER IF EXISTS enforce_audit_failures_immutability ON public.audit_failures;
CREATE TRIGGER enforce_audit_failures_immutability
  BEFORE UPDATE OR DELETE ON public.audit_failures
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_tampering();

-- Force RLS even for table owner
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_failures FORCE ROW LEVEL SECURITY;

-- Revoke TRUNCATE from postgres (prevents bulk wipe via SQL Editor)
REVOKE TRUNCATE ON public.audit_logs FROM postgres;
REVOKE TRUNCATE ON public.audit_failures FROM postgres;
