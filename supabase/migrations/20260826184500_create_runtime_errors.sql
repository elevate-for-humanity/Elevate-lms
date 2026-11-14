-- Canonical persistence for the Admin Runtime QA dashboard.
-- Runtime producers use the service role; authenticated platform admins may read
-- and resolve findings through RLS-protected application routes.

CREATE TABLE IF NOT EXISTS public.runtime_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level IN ('error', 'warning', 'info')),
  source text NOT NULL CHECK (source IN ('console', 'api', 'build', 'typescript', 'network')),
  message text NOT NULL,
  source_file text,
  line_number integer CHECK (line_number IS NULL OR line_number > 0),
  stack text,
  resolved boolean NOT NULL DEFAULT false,
  auto_fixable boolean NOT NULL DEFAULT false,
  fix_applied text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS runtime_errors_unresolved_timestamp_idx
  ON public.runtime_errors ("timestamp" DESC)
  WHERE resolved = false;

ALTER TABLE public.runtime_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS runtime_errors_admin_select ON public.runtime_errors;
CREATE POLICY runtime_errors_admin_select
  ON public.runtime_errors
  FOR SELECT
  TO authenticated
  USING ((SELECT rpc_private.is_admin()));

DROP POLICY IF EXISTS runtime_errors_admin_update ON public.runtime_errors;
CREATE POLICY runtime_errors_admin_update
  ON public.runtime_errors
  FOR UPDATE
  TO authenticated
  USING ((SELECT rpc_private.is_admin()))
  WITH CHECK ((SELECT rpc_private.is_admin()));

GRANT SELECT, UPDATE ON public.runtime_errors TO authenticated;

COMMENT ON TABLE public.runtime_errors IS
  'Sanitized runtime findings displayed by the administrator Runtime QA dashboard.';
