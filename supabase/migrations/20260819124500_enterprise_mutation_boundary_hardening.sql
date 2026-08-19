-- Enterprise mutation-boundary hardening.
-- These functions are invoked by server/service-role paths after application-level
-- ownership/role checks. Direct PostgREST execution by arbitrary signed-in users
-- is not part of the supported contract.

REVOKE ALL ON FUNCTION public.auto_clock_out_if_needed(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_clock_out_if_needed(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.update_geofence_state(uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_geofence_state(uuid, numeric, numeric) TO service_role;

-- Legacy overload accepts a caller-supplied actor id and must remain server-only.
REVOKE ALL ON FUNCTION public.revoke_application_access_atomic(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_application_access_atomic(uuid, uuid, text) TO service_role;

-- Canonical platform course publishing is server-owned. Organization authors use
-- publish_organization_course(), which performs organization membership checks.
REVOKE ALL ON FUNCTION public.publish_course(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_course(uuid) TO service_role;

-- Checkpoint attempts are scored and persisted by the server-side LMS engine.
-- The client must never be able to submit an authoritative score directly.
REVOKE ALL ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, integer, integer, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, integer, integer, integer, jsonb) TO service_role;
