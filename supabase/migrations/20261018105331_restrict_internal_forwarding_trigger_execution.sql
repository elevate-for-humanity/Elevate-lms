-- Internal trigger enforcement needs no public RPC execution grant.
-- Preserve the trigger, function body, existing service-role grant and phone data.
DO $boundary$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'enforce_admin_cell_forwarding'
      AND p.pronargs = 0 AND p.prorettype = 'trigger'::regtype
      AND EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgfoid = p.oid AND NOT t.tgisinternal)
  ) THEN
    RAISE EXCEPTION 'Expected internal forwarding trigger is unavailable';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.enforce_admin_cell_forwarding()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Expected backend execution grant is unavailable';
  END IF;
END
$boundary$;

REVOKE EXECUTE ON FUNCTION public.enforce_admin_cell_forwarding()
FROM PUBLIC, anon, authenticated;
