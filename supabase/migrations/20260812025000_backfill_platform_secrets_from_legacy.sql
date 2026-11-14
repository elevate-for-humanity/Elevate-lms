-- Backfill keys that still exist only in legacy app_secrets.
-- Existing platform_secrets values always win; no canonical value is overwritten.

INSERT INTO public.platform_secrets (
  key,
  value_enc,
  description,
  category,
  is_sensitive,
  scope,
  created_at,
  updated_at
)
SELECT
  a.key,
  a.value,
  COALESCE(NULLIF(a.description, ''), NULLIF(a.note, '')),
  'legacy-migrated',
  true,
  CASE
    WHEN a.scope IN ('runtime', 'build', 'unused') THEN a.scope
    ELSE 'runtime'
  END,
  COALESCE(a.updated_at, now()),
  COALESCE(a.updated_at, now())
FROM public.app_secrets a
WHERE a.key IS NOT NULL
  AND a.value IS NOT NULL
  AND length(trim(a.value)) > 0
ON CONFLICT (key) DO NOTHING;
