-- Canonical Admin Studio collaboration comments.
-- This replaces the retired pre-unification studio_comments table with a
-- deliberately small, Admin-owned review contract.

CREATE TABLE IF NOT EXISTS public.studio_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL CHECK (char_length(file_path) BETWEEN 1 AND 500),
  branch text NOT NULL DEFAULT 'main' CHECK (char_length(branch) BETWEEN 1 AND 200),
  line_start integer NOT NULL CHECK (line_start > 0),
  line_end integer CHECK (line_end IS NULL OR line_end >= line_start),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS studio_review_comments_open_idx
  ON public.studio_review_comments (resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS studio_review_comments_created_by_idx
  ON public.studio_review_comments (created_by);
CREATE INDEX IF NOT EXISTS studio_review_comments_resolved_by_idx
  ON public.studio_review_comments (resolved_by)
  WHERE resolved_by IS NOT NULL;

DROP TRIGGER IF EXISTS studio_review_comments_updated_at ON public.studio_review_comments;
CREATE TRIGGER studio_review_comments_updated_at
  BEFORE UPDATE ON public.studio_review_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.studio_review_comments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.studio_review_comments FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.studio_review_comments TO authenticated;

DROP POLICY IF EXISTS studio_review_comments_admin_aal2_select ON public.studio_review_comments;
DROP POLICY IF EXISTS studio_review_comments_admin_aal2_insert ON public.studio_review_comments;
DROP POLICY IF EXISTS studio_review_comments_admin_aal2_update ON public.studio_review_comments;

CREATE POLICY studio_review_comments_admin_aal2_select
  ON public.studio_review_comments FOR SELECT TO authenticated
  USING (
    rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  );

CREATE POLICY studio_review_comments_admin_aal2_insert
  ON public.studio_review_comments FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  );

CREATE POLICY studio_review_comments_admin_aal2_update
  ON public.studio_review_comments FOR UPDATE TO authenticated
  USING (
    rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  )
  WITH CHECK (
    rpc_private.is_admin()
    AND (SELECT security_private.privileged_session_mfa_satisfied())
  );

COMMENT ON TABLE public.studio_review_comments IS
  'Canonical Admin Dev Studio file review comments; access requires Admin plus AAL2.';
