-- Consolidate Dev Studio secret management on platform_secrets.
-- app_secrets remains a read-only legacy fallback during migration, but new
-- Studio writes use platform_secrets exclusively.

ALTER TABLE public.platform_secrets
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'runtime';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.platform_secrets'::regclass
      AND conname = 'platform_secrets_scope_check'
  ) THEN
    ALTER TABLE public.platform_secrets
      ADD CONSTRAINT platform_secrets_scope_check
      CHECK (scope IN ('runtime', 'build', 'unused'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_platform_secrets_scope
  ON public.platform_secrets(scope);

COMMENT ON COLUMN public.platform_secrets.scope IS
  'Dev Studio secret lifecycle scope: runtime values hydrate process.env; build and unused values do not.';
