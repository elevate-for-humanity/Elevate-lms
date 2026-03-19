-- =============================================================================
-- Partner LMS + SCORM schema fixes
--
-- Fixes three structural gaps identified in the 2026-05 audit:
--   1. partner_lms_providers missing PRIMARY KEY
--   2. partner_lms_courses missing course_type discriminator column
--   3. scorm_packages, scorm_enrollments, partner_course_mappings referenced
--      in lib/actions/scorm.ts but never created
--
-- Safe to re-run (all statements are IF NOT EXISTS / DO NOTHING).
-- Apply in Supabase Dashboard → SQL Editor.
-- =============================================================================

BEGIN;

-- ── 1. partner_lms_providers — ensure id column exists and is PK ─────────────

ALTER TABLE public.partner_lms_providers
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'partner_lms_providers'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.partner_lms_providers ADD PRIMARY KEY (id);
  END IF;
END $$;

-- ── 2. partner_lms_courses — add course_type discriminator ───────────────────

ALTER TABLE public.partner_lms_courses
  ADD COLUMN IF NOT EXISTS course_type TEXT NOT NULL DEFAULT 'partner'
  CHECK (course_type IN ('partner', 'micro', 'scorm'));

-- ── 3. scorm_packages ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scorm_packages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID        REFERENCES public.training_courses(id) ON DELETE SET NULL,
  title           TEXT,
  launch_url      TEXT        NOT NULL,
  version         TEXT        DEFAULT '1.2',
  metadata        JSONB       DEFAULT '{}',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scorm_packages_course_id ON public.scorm_packages(course_id);

-- ── 4. scorm_enrollments ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scorm_enrollments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scorm_package_id    UUID        NOT NULL REFERENCES public.scorm_packages(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id       UUID,       -- optional link to program_enrollments
  status              TEXT        NOT NULL DEFAULT 'not_attempted'
                      CHECK (status IN ('not_attempted','incomplete','completed','passed','failed','browsed')),
  progress_percentage NUMERIC     NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  score               NUMERIC,
  time_spent_seconds  INTEGER     NOT NULL DEFAULT 0,
  last_accessed_at    TIMESTAMPTZ,
  cmi_data            JSONB       DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scorm_package_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_scorm_enrollments_user_id    ON public.scorm_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_scorm_enrollments_package_id ON public.scorm_enrollments(scorm_package_id);

-- ── 5. scorm_tracking ────────────────────────────────────────────────────────
-- Individual CMI element writes (referenced in lib/actions/scorm.ts)

CREATE TABLE IF NOT EXISTS public.scorm_tracking (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scorm_enrollment_id   UUID        NOT NULL REFERENCES public.scorm_enrollments(id) ON DELETE CASCADE,
  element               TEXT        NOT NULL,
  value                 TEXT,
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scorm_tracking_enrollment_id ON public.scorm_tracking(scorm_enrollment_id);

-- ── 6. partner_course_mappings ───────────────────────────────────────────────
-- Maps a partner_lms_courses row to an optional scorm_packages row.
-- Also used to map program slugs to partner course IDs for enrollment routing.

CREATE TABLE IF NOT EXISTS public.partner_course_mappings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug        TEXT,
  partner_course_id   UUID        REFERENCES public.partner_lms_courses(id) ON DELETE CASCADE,
  scorm_package_id    UUID        REFERENCES public.scorm_packages(id) ON DELETE SET NULL,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcm_program_slug        ON public.partner_course_mappings(program_slug);
CREATE INDEX IF NOT EXISTS idx_pcm_partner_course_id   ON public.partner_course_mappings(partner_course_id);

-- ── 7. lms_sync_log — ensure it exists (referenced in partnerEnrollment.ts) ──

CREATE TABLE IF NOT EXISTS public.lms_sync_log (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID        REFERENCES public.partner_lms_providers(id) ON DELETE SET NULL,
  sync_type         TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed')),
  records_processed INTEGER     DEFAULT 0,
  sync_data         JSONB       DEFAULT '{}',
  error_message     TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lms_sync_log_provider_id ON public.lms_sync_log(provider_id);

-- ── 8. partner_lms_enrollment_failures — ensure it exists ────────────────────

CREATE TABLE IF NOT EXISTS public.partner_lms_enrollment_failures (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_id   UUID        REFERENCES public.partner_lms_providers(id) ON DELETE SET NULL,
  course_id     UUID        REFERENCES public.partner_lms_courses(id) ON DELETE SET NULL,
  program_id    UUID,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
