-- Migration: Add a SECURITY DEFINER function to allow service-level audit log cleanup
-- This is needed because audit_logs has RLS with no DELETE policy.
-- The function runs as the table owner and bypasses RLS for cleanup operations only.

CREATE OR REPLACE FUNCTION public.admin_purge_audit_logs_for_users(user_ids UUID[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.audit_logs
  WHERE actor_id = ANY(user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Only service_role can call this
REVOKE ALL ON FUNCTION public.admin_purge_audit_logs_for_users(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_purge_audit_logs_for_users(UUID[]) TO service_role;
