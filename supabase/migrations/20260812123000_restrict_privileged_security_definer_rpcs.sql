-- Restrict clearly privileged SECURITY DEFINER RPCs from public/client roles.
-- Preserve service_role execution for trusted server-side workflows.

REVOKE EXECUTE ON FUNCTION public._tmp_get_triggers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._tmp_get_triggers() TO service_role;

REVOKE EXECUTE ON FUNCTION public.schema_inspect(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.schema_inspect(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.admin_revenue_summary(timestamptz,timestamptz,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revenue_summary(timestamptz,timestamptz,timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.admin_claim_applications_for_user(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_claim_applications_for_user(uuid,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.approve_application_atomic(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_application_atomic(uuid,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid,uuid,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.approve_and_provision_program_holder(uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_and_provision_program_holder(uuid,uuid,uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.approve_cna_atomic(uuid,uuid,uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_cna_atomic(uuid,uuid,uuid,uuid,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.deprovision_program(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deprovision_program(uuid,uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.activate_license(uuid,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_license(uuid,timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.suspend_license(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_license(uuid,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.expire_license(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_license(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.expire_all_overdue_licenses() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_all_overdue_licenses() TO service_role;

REVOKE EXECUTE ON FUNCTION public.complete_enrollment_payment(uuid,text,text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_enrollment_payment(uuid,text,text,text,integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.upsert_stripe_session(text,text,text,integer,text,timestamptz,text,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_stripe_session(text,text,text,integer,text,timestamptz,text,text,text,text,text,jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.lookup_stripe_enrollment_map(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_stripe_enrollment_map(text,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.rpc_approve_partner(uuid,uuid,text,uuid[],text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_approve_partner(uuid,uuid,text,uuid[],text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.rpc_enroll_student(uuid,uuid,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_enroll_student(uuid,uuid,text,text,jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.rpc_link_partner_user(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_link_partner_user(uuid,uuid,text,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.export_audit_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.export_audit_snapshot() TO service_role;