-- App secrets store: moves environment variables out of Netlify function env
-- (which has a 4 KB AWS Lambda limit) into Supabase, fetched at runtime.
--
-- Only the service role can read/write. The Next.js SSR handler and Netlify
-- functions authenticate with SUPABASE_SERVICE_ROLE_KEY (one of the few vars
-- that stays in Netlify env).

CREATE TABLE IF NOT EXISTS app_secrets (
  key   text PRIMARY KEY,
  value text NOT NULL,
  scope text NOT NULL DEFAULT 'runtime',  -- 'runtime' | 'build' | 'unused'
  note  text,
  updated_at timestamptz DEFAULT now()
);

-- Service-role only — no public/anon access
ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON app_secrets;
CREATE POLICY "Service role full access" ON app_secrets
  FOR ALL USING (auth.role() = 'service_role');

-- Index for bulk fetch (the common path: fetch all runtime secrets once)
CREATE INDEX IF NOT EXISTS idx_app_secrets_scope ON app_secrets (scope);

COMMENT ON TABLE app_secrets IS 'Runtime secrets store — replaces Netlify env vars to stay under the 4 KB Lambda limit';
