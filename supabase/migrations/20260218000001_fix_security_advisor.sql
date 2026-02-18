-- Fix Supabase Security Advisor: set security_invoker = true on all
-- public views that default to SECURITY DEFINER.

BEGIN;

ALTER VIEW IF EXISTS public.sfc_tax_return_public_status SET (security_invoker = true);
ALTER VIEW IF EXISTS public.audit_snapshot SET (security_invoker = true);
ALTER VIEW IF EXISTS public.etpl_metrics SET (security_invoker = true);
ALTER VIEW IF EXISTS public.partner_lms_courses SET (security_invoker = true);
ALTER VIEW IF EXISTS public.license_usage SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_active_programs SET (security_invoker = true);
ALTER VIEW IF EXISTS public.partner_enrollment_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.scorm_completion_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_published_programs SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_applications SET (security_invoker = true);
ALTER VIEW IF EXISTS public.shop_required_docs_status SET (security_invoker = true);
ALTER VIEW IF EXISTS public.admin_applications_queue SET (security_invoker = true);
ALTER VIEW IF EXISTS public.apprenticeship_hours SET (security_invoker = true);
ALTER VIEW IF EXISTS public.apprenticeship_hours_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_capabilities SET (security_invoker = true);
ALTER VIEW IF EXISTS public.enrollments SET (security_invoker = true);
ALTER VIEW IF EXISTS public.lessons SET (security_invoker = true);
ALTER VIEW IF EXISTS public.open_timeclock_shifts SET (security_invoker = true);
ALTER VIEW IF EXISTS public.timeclock_ui_state SET (security_invoker = true);
ALTER VIEW IF EXISTS public.indiana_timeclock_daily_export SET (security_invoker = true);
ALTER VIEW IF EXISTS public.indiana_timeclock_weekly_summary_export SET (security_invoker = true);
ALTER VIEW IF EXISTS public.courses SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_app_slow_queries SET (security_invoker = true);
ALTER VIEW IF EXISTS public.sfc_tax_returns_public_lookup SET (security_invoker = true);
ALTER VIEW IF EXISTS public.sfc_tax_return_public_status_v2 SET (security_invoker = true);
ALTER VIEW IF EXISTS public.apprentice_hour_totals SET (security_invoker = true);
ALTER VIEW IF EXISTS public.apprentice_hours_by_source SET (security_invoker = true);
ALTER VIEW IF EXISTS public.apprentice_hours_by_shop SET (security_invoker = true);
ALTER VIEW IF EXISTS public.admin_compliance_status SET (security_invoker = true);

-- Narrow anon SELECT on sfc_tax_returns so public tracking views work
DROP POLICY IF EXISTS "sfc_tax_returns_anon_tracking" ON sfc_tax_returns;
CREATE POLICY "sfc_tax_returns_anon_tracking" ON sfc_tax_returns
  FOR SELECT TO anon
  USING (tracking_id IS NOT NULL);

COMMIT;
