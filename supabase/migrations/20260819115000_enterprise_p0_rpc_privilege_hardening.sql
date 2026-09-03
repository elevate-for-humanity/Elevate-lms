-- Enterprise P0 RPC privilege hardening.
REVOKE ALL ON FUNCTION public.enroll_application(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_application(uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.enroll_application(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_application(uuid, uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.update_enrollment_progress_manual(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_enrollment_progress_manual(uuid, uuid, integer) TO service_role;
REVOKE ALL ON FUNCTION public.issue_program_completion_certificate_if_eligible(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_program_completion_certificate_if_eligible(uuid, uuid) TO service_role;
