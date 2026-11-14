-- Restrict SECURITY DEFINER functions that expose sensitive data or privileged mutations
-- and contain no caller authorization checks. Preserve trusted server-side access.

REVOKE EXECUTE ON FUNCTION public.encrypt_ssn(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_ssn(text,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_revenue_all_time() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_all_time() TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_revenue_last_month() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_last_month() TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_revenue_this_month() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_this_month() TO service_role;

REVOKE EXECUTE ON FUNCTION public.admin_inactive_learners(integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_inactive_learners(integer,integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.archive_stale_applications(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.archive_stale_applications(integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.enqueue_notification(text,text,jsonb,text,uuid,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_notification(text,text,jsonb,text,uuid,timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.generate_notification_token(text,text,uuid,text,integer,integer,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_notification_token(text,text,uuid,text,integer,integer,jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_tax_appointment_stats(date,date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tax_appointment_stats(date,date) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_tax_document_stats(timestamptz,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tax_document_stats(timestamptz,timestamptz) TO service_role;