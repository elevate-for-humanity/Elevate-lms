-- Canonical program operational schema.
--
-- Replaces the flat single-row program_ctas and program_media tables created
-- in migration 20260503000006 with typed multi-row tables that match the
-- canonical program page data model.
--
-- Also adds program_tracks, program_lessons, and DB-enforced publish guard.
-- All operations are safe to re-run (IF NOT EXISTS / OR REPLACE).

-- ── Drop previous flat tables (no data worth keeping — seeded this session) ──

DROP TABLE IF EXISTS public.program_ctas CASCADE;
DROP TABLE IF EXISTS public.program_media CASCADE;
DROP TABLE IF EXISTS public.program_enrollment_tracks CASCADE;
DROP TABLE IF EXISTS public.program_curriculum_modules CASCADE;

-- ── 1. programs — add missing columns ────────────────────────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS hero_headline      TEXT,
  ADD COLUMN IF NOT EXISTS hero_subheadline   TEXT,
  ADD COLUMN IF NOT EXISTS length_weeks       INTEGER,
  ADD COLUMN IF NOT EXISTS certificate_title  TEXT,
  ADD COLUMN IF NOT EXISTS funding            TEXT,
  ADD COLUMN IF NOT EXISTS outcomes           TEXT,
  ADD COLUMN IF NOT EXISTS requirements       TEXT;

CREATE INDEX IF NOT EXISTS idx_programs_slug      ON public.programs(slug);
CREATE INDEX IF NOT EXISTS idx_programs_published ON public.programs(published);

-- ── 2. program_media ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  media_type  TEXT        NOT NULL CHECK (media_type IN ('hero_image','hero_video','gallery_image','thumbnail')),
  url         TEXT        NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_media_program_id ON public.program_media(program_id);

-- ── 3. program_ctas ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_ctas (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  cta_type      TEXT    NOT NULL CHECK (cta_type IN ('apply','request_info','external','waitlist')),
  label         TEXT    NOT NULL,
  href          TEXT    NOT NULL,
  style_variant TEXT    NOT NULL DEFAULT 'primary' CHECK (style_variant IN ('primary','secondary','ghost','link')),
  is_external   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_ctas_program_id ON public.program_ctas(program_id);

-- ── 4. program_tracks ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_tracks (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  track_code          TEXT    NOT NULL,
  title               TEXT    NOT NULL,
  description         TEXT,
  funding_type        TEXT    NOT NULL CHECK (funding_type IN ('funded','self_pay','partner','employer_sponsored','other')),
  cost_cents          INTEGER,
  available           BOOLEAN NOT NULL DEFAULT TRUE,
  coming_soon_message TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, track_code)
);

CREATE INDEX IF NOT EXISTS idx_program_tracks_program_id ON public.program_tracks(program_id);

-- ── 5. program_modules ───────────────────────────────────────────────────────
-- Drop and recreate — existing table has no program_id FK (wrong schema).

DROP TABLE IF EXISTS public.program_modules CASCADE;

CREATE TABLE IF NOT EXISTS public.program_modules (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id     UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  module_number  INTEGER NOT NULL,
  title          TEXT    NOT NULL,
  description    TEXT,
  lesson_count   INTEGER NOT NULL DEFAULT 0,
  duration_hours NUMERIC(6,2),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, module_number)
);

CREATE INDEX IF NOT EXISTS idx_program_modules_program_id ON public.program_modules(program_id);

-- ── 6. program_lessons ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_lessons (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID    NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  lesson_number    INTEGER NOT NULL,
  title            TEXT    NOT NULL,
  lesson_type      TEXT    NOT NULL DEFAULT 'lesson'
                     CHECK (lesson_type IN ('lesson','quiz','lab','exam','orientation')),
  duration_minutes INTEGER,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, lesson_number)
);

CREATE INDEX IF NOT EXISTS idx_program_lessons_module_id ON public.program_lessons(module_id);

-- ── 7. Publish guard ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_publish_program(p_program_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_module BOOLEAN;
  v_has_track  BOOLEAN;
  v_has_cta    BOOLEAN;
  v_has_media  BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.program_modules WHERE program_id = p_program_id)
    INTO v_has_module;
  SELECT EXISTS(SELECT 1 FROM public.program_tracks  WHERE program_id = p_program_id AND available = TRUE)
    INTO v_has_track;
  SELECT EXISTS(SELECT 1 FROM public.program_ctas    WHERE program_id = p_program_id)
    INTO v_has_cta;
  SELECT EXISTS(SELECT 1 FROM public.program_media   WHERE program_id = p_program_id
                  AND media_type IN ('hero_image','hero_video'))
    INTO v_has_media;

  RETURN v_has_module AND v_has_track AND v_has_cta AND v_has_media;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_program(p_program_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.can_publish_program(p_program_id) THEN
    RAISE EXCEPTION 'Program cannot be published. Missing modules, tracks, CTAs, or hero media.';
  END IF;

  UPDATE public.programs
  SET published = TRUE
  WHERE id = p_program_id;
END;
$$;

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('program_media','program_ctas','program_tracks','program_modules','program_lessons')
-- ORDER BY tablename;
