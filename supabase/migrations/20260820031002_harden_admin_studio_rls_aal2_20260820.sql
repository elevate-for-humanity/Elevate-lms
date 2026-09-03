-- Government-purchase hardening: privileged Admin/Studio tables must require BOTH admin role and AAL2.
-- PostgreSQL permissive RLS policies are OR-combined, so broad authenticated policies and
-- separate MFA policies do not enforce an AND boundary.

DO $$
DECLARE
  t text;
  p text;
BEGIN
  FOREACH t IN ARRAY ARRAY['admin_activity_log','admin_alerts','studio_chat_history','studio_sessions']
  LOOP
    FOREACH p IN ARRAY ARRAY[
      'admin_bypass_select','admin_bypass_insert','admin_bypass_update','admin_bypass_delete',
      'require_privileged_aal2'
    ]
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
    END LOOP;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Admin read" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admin insert" ON public.admin_activity_log;
DROP POLICY IF EXISTS auth_read_admin_alerts ON public.admin_alerts;
DROP POLICY IF EXISTS auth_read_studio_chat_history ON public.studio_chat_history;
DROP POLICY IF EXISTS auth_read_studio_sessions ON public.studio_sessions;

CREATE POLICY admin_activity_log_admin_aal2_select
  ON public.admin_activity_log FOR SELECT TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY admin_activity_log_admin_aal2_insert
  ON public.admin_activity_log FOR INSERT TO authenticated
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY admin_activity_log_admin_aal2_update
  ON public.admin_activity_log FOR UPDATE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()))
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY admin_activity_log_admin_aal2_delete
  ON public.admin_activity_log FOR DELETE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));

CREATE POLICY admin_alerts_admin_aal2_select
  ON public.admin_alerts FOR SELECT TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY admin_alerts_admin_aal2_insert
  ON public.admin_alerts FOR INSERT TO authenticated
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY admin_alerts_admin_aal2_update
  ON public.admin_alerts FOR UPDATE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()))
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY admin_alerts_admin_aal2_delete
  ON public.admin_alerts FOR DELETE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));

CREATE POLICY studio_chat_history_admin_aal2_select
  ON public.studio_chat_history FOR SELECT TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY studio_chat_history_admin_aal2_insert
  ON public.studio_chat_history FOR INSERT TO authenticated
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY studio_chat_history_admin_aal2_update
  ON public.studio_chat_history FOR UPDATE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()))
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY studio_chat_history_admin_aal2_delete
  ON public.studio_chat_history FOR DELETE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));

CREATE POLICY studio_sessions_admin_aal2_select
  ON public.studio_sessions FOR SELECT TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY studio_sessions_admin_aal2_insert
  ON public.studio_sessions FOR INSERT TO authenticated
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY studio_sessions_admin_aal2_update
  ON public.studio_sessions FOR UPDATE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()))
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY studio_sessions_admin_aal2_delete
  ON public.studio_sessions FOR DELETE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
