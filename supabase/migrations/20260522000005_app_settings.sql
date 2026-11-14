-- Generic key/value store for app-level settings (OAuth tokens, feature flags, etc.)
-- Used by QB OAuth callback to persist tokens without requiring SSM access

CREATE TABLE IF NOT EXISTS public.app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only service role (admin client) can read/write — no user access
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only"
  ON public.app_settings
  FOR ALL
  USING (false)
  WITH CHECK (false);
