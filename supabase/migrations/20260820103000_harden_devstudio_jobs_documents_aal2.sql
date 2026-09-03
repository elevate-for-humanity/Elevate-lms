-- Align persistent Dev Studio jobs/documents with the Admin-only + AAL2 boundary.
ALTER TABLE public.devstudio_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devstudio_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS devstudio_documents_admin_read ON public.devstudio_documents;
DROP POLICY IF EXISTS devstudio_documents_own ON public.devstudio_documents;
DROP POLICY IF EXISTS devstudio_jobs_own ON public.devstudio_jobs;
DROP POLICY IF EXISTS devstudio_jobs_super_admin_read ON public.devstudio_jobs;

CREATE POLICY devstudio_documents_admin_aal2_all
ON public.devstudio_documents
FOR ALL
TO authenticated
USING (
  rpc_private.is_admin()
  AND (SELECT security_private.privileged_session_mfa_satisfied())
)
WITH CHECK (
  rpc_private.is_admin()
  AND (SELECT security_private.privileged_session_mfa_satisfied())
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY devstudio_jobs_admin_aal2_all
ON public.devstudio_jobs
FOR ALL
TO authenticated
USING (
  rpc_private.is_admin()
  AND (SELECT security_private.privileged_session_mfa_satisfied())
)
WITH CHECK (
  rpc_private.is_admin()
  AND (SELECT security_private.privileged_session_mfa_satisfied())
  AND user_id = auth.uid()
);
