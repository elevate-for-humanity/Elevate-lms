-- Isolated QA only: repair the missing platform_secrets schema dependency.
-- TARGET: elevate-lms-qa (isdgjcdabhxxozarmxta). Never apply to production.
-- This is a zero-row structural stage. Never copy secret values or production credentials.
-- The historical dev_studio_schema_reconcile migration cannot be replayed into
-- the staged QA subset: it also alters ai_agents, ai_tasks and other unstaged tables.

CREATE TABLE IF NOT EXISTS public.platform_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value_enc text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_sensitive boolean NOT NULL DEFAULT true,
  last_tested timestamptz,
  test_status text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  scope text NOT NULL DEFAULT 'runtime',
  vault_secret_id uuid,
  CONSTRAINT platform_secrets_scope_check CHECK (scope IN ('runtime', 'build', 'unused')),
  CONSTRAINT platform_secrets_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);

ALTER TABLE public.platform_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.platform_secrets TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'platform_secrets'
      AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.platform_secrets
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_fk_platform_secrets_06076b2f0ae7 ON public.platform_secrets (updated_by);
CREATE INDEX IF NOT EXISTS idx_platform_secrets_category ON public.platform_secrets (category);
CREATE INDEX IF NOT EXISTS idx_platform_secrets_key ON public.platform_secrets (key);
CREATE INDEX IF NOT EXISTS idx_platform_secrets_scope ON public.platform_secrets (scope);

NOTIFY pgrst, 'reload schema';
