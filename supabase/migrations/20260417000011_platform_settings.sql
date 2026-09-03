-- platform_settings: key/value store for admin-configurable platform settings.
-- Referenced by 6 code locations in admin settings and env-vars routes.
-- Table already exists live — this migration documents the schema for audit purposes.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.platform_settings IS
  'Admin-configurable key/value settings. Values stored plaintext — do not store secrets here.';
