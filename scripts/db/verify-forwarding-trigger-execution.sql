-- Rehearse the actual trigger as a client without touching persistent phone data.
BEGIN;
DO $privileges$
BEGIN
  IF has_function_privilege('anon', 'public.enforce_admin_cell_forwarding()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.enforce_admin_cell_forwarding()', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.enforce_admin_cell_forwarding()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Internal forwarding execution boundary failed';
  END IF;
END
$privileges$;
CREATE TEMPORARY TABLE forwarding_privilege_probe (
  admin_external_fallback boolean, external_fallback_number text,
  extension text, workspace_id uuid
) ON COMMIT DROP;
CREATE TRIGGER forwarding_privilege_probe
BEFORE INSERT OR UPDATE ON forwarding_privilege_probe
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_cell_forwarding();
GRANT INSERT, SELECT ON forwarding_privilege_probe TO authenticated;
SET LOCAL ROLE authenticated;
INSERT INTO forwarding_privilege_probe VALUES (false, null, '101', null);
DO $test$
BEGIN
  BEGIN
    INSERT INTO forwarding_privilege_probe VALUES (true, '+12025550199', '101', null);
    RAISE EXCEPTION 'Unsafe forwarding was allowed';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END
$test$;
RESET ROLE;
SELECT count(*) = 1 AS trigger_enforced FROM forwarding_privilege_probe;
ROLLBACK;
