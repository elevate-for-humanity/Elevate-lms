-- Pending migrations bundle - apply all at once in Supabase Dashboard SQL Editor.
--
-- Includes (in order):
--   20260702000009  normalize_two_factor_auth
--   20260702000010  onboarding_progress_unique
--   20260702000011  ensure_storage_buckets
--   20260702000012  external_courses_support_fee
--
-- All are idempotent - safe to re-run.

-- ============================================================================
-- 20260702000009 - normalize_two_factor_auth
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'two_factor_auth'
      AND column_name = 'is_enabled'
  ) THEN
    UPDATE public.two_factor_auth
    SET enabled = TRUE
    WHERE is_enabled = TRUE AND (enabled IS NULL OR enabled = FALSE);

    ALTER TABLE public.two_factor_auth DROP COLUMN IF EXISTS is_enabled;
  END IF;
END $$;

ALTER TABLE public.two_factor_auth
  ALTER COLUMN enabled SET DEFAULT false,
  ALTER COLUMN enabled SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'two_factor_auth_user_id_fkey'
      AND conrelid = 'public.two_factor_auth'::regclass
  ) THEN
    ALTER TABLE public.two_factor_auth
      ADD CONSTRAINT two_factor_auth_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'two_factor_auth_user_id_unique'
      AND conrelid = 'public.two_factor_auth'::regclass
  ) THEN
    ALTER TABLE public.two_factor_auth
      ADD CONSTRAINT two_factor_auth_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id
  ON public.two_factor_auth (user_id);

-- Convert backup_codes from text to text[] if still text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'two_factor_auth'
      AND column_name  = 'backup_codes'
      AND data_type    = 'text'
  ) THEN
    ALTER TABLE public.two_factor_auth
      ALTER COLUMN backup_codes TYPE text[]
        USING CASE
          WHEN backup_codes IS NULL THEN NULL
          ELSE ARRAY[backup_codes]
        END;
  END IF;
END $$;

-- ============================================================================
-- 20260702000010 - onboarding_progress_unique
-- ============================================================================

DELETE FROM public.onboarding_progress op
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, step) id
  FROM public.onboarding_progress
  ORDER BY user_id, step, completed_at DESC NULLS LAST, created_at DESC NULLS LAST
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'onboarding_progress_user_step_unique'
      AND conrelid = 'public.onboarding_progress'::regclass
  ) THEN
    ALTER TABLE public.onboarding_progress
      ADD CONSTRAINT onboarding_progress_user_step_unique UNIQUE (user_id, step);
  END IF;
END $$;

-- ============================================================================
-- 20260702000011 - ensure_storage_buckets
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documents',             'documents',             false, 52428800,   ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('agreements',            'agreements',            false, 20971520,   ARRAY['application/pdf','image/png','image/jpeg']),
  ('assignments',           'assignments',           false, 52428800,   ARRAY['application/pdf','image/jpeg','image/png','video/mp4','application/zip']),
  ('mous',                  'mous',                  false, 20971520,   ARRAY['application/pdf','image/png','image/jpeg']),
  ('contracts',             'contracts',             false, 20971520,   ARRAY['application/pdf','image/png','image/jpeg']),
  ('files',                 'files',                 false, 104857600,  NULL),
  ('media',                 'media',                 true,  104857600,  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','audio/mpeg']),
  ('avatars',               'avatars',               true,  5242880,    ARRAY['image/jpeg','image/png','image/webp']),
  ('course-content',        'course-content',        false, 524288000,  NULL),
  ('course_content',        'course_content',        false, 524288000,  NULL),
  ('course-videos',         'course-videos',         false, 524288000,  ARRAY['video/mp4','video/webm','video/quicktime']),
  ('course_videos',         'course_videos',         false, 524288000,  ARRAY['video/mp4','video/webm','video/quicktime']),
  ('curriculum',            'curriculum',            false, 104857600,  NULL),
  ('submissions',           'submissions',           false, 104857600,  NULL),
  ('certificates',          'certificates',          true,  10485760,   ARRAY['application/pdf','image/png','image/jpeg']),
  ('profile-photos',        'profile-photos',        true,  5242880,    ARRAY['image/jpeg','image/png','image/webp']),
  ('employer-logos',        'employer-logos',        true,  5242880,    ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('program-images',        'program-images',        true,  20971520,   ARRAY['image/jpeg','image/png','image/webp']),
  ('lesson-attachments',    'lesson-attachments',    false, 104857600,  NULL),
  ('grant-documents',       'grant-documents',       false, 52428800,   ARRAY['application/pdf','image/jpeg','image/png']),
  ('compliance-docs',       'compliance-docs',       false, 52428800,   ARRAY['application/pdf','image/jpeg','image/png']),
  ('tax-documents',         'tax-documents',         false, 52428800,   ARRAY['application/pdf','image/jpeg','image/png']),
  ('ojt-records',           'ojt-records',           false, 52428800,   ARRAY['application/pdf','image/jpeg','image/png']),
  ('apprenticeship-docs',   'apprenticeship-docs',   false, 52428800,   ARRAY['application/pdf','image/jpeg','image/png']),
  ('wex-agreements',        'wex-agreements',        false, 20971520,   ARRAY['application/pdf','image/png','image/jpeg']),
  ('employer-agreements',   'employer-agreements',   false, 20971520,   ARRAY['application/pdf','image/png','image/jpeg']),
  ('testing-center',        'testing-center',        false, 52428800,   NULL),
  ('ai-outputs',            'ai-outputs',            false, 104857600,  NULL),
  ('exports',               'exports',               false, 104857600,  NULL),
  ('temp',                  'temp',                  false, 104857600,  NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 20260702000012 - external_courses_support_fee
-- ============================================================================

ALTER TABLE public.program_external_courses
  ADD COLUMN IF NOT EXISTS elevate_fee_cents  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_label          text    NOT NULL DEFAULT 'Elevate Program Support Fee',
  ADD COLUMN IF NOT EXISTS support_included   jsonb   NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_pec_fee
  ON public.program_external_courses (elevate_fee_cents)
  WHERE elevate_fee_cents > 0;
