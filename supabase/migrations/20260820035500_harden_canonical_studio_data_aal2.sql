-- Canonical Studio data is privileged Admin data. Require admin role + AAL2 for
-- authenticated access; service-role access is unaffected by RLS.

DROP POLICY IF EXISTS admin_all ON public.devstudio_chat_log;
DROP POLICY IF EXISTS user_own ON public.devstudio_chat_log;

CREATE POLICY devstudio_chat_log_admin_aal2_select
  ON public.devstudio_chat_log FOR SELECT TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY devstudio_chat_log_admin_aal2_insert
  ON public.devstudio_chat_log FOR INSERT TO authenticated
  WITH CHECK (
    rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
    AND (user_id IS NULL OR user_id = auth.uid())
  );
CREATE POLICY devstudio_chat_log_admin_aal2_update
  ON public.devstudio_chat_log FOR UPDATE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()))
  WITH CHECK (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));
CREATE POLICY devstudio_chat_log_admin_aal2_delete
  ON public.devstudio_chat_log FOR DELETE TO authenticated
  USING (rpc_private.is_admin() AND (SELECT security_private.privileged_session_mfa_satisfied()));

DROP POLICY IF EXISTS "Users can delete own conversations" ON public.studio_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.studio_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.studio_conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.studio_conversations;

CREATE POLICY studio_conversations_admin_aal2_select
  ON public.studio_conversations FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  );
CREATE POLICY studio_conversations_admin_aal2_insert
  ON public.studio_conversations FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  );
CREATE POLICY studio_conversations_admin_aal2_update
  ON public.studio_conversations FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  );
CREATE POLICY studio_conversations_admin_aal2_delete
  ON public.studio_conversations FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  );
