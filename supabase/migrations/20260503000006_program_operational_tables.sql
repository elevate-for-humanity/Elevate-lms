-- Phase 3 continuation: operational tables for program pages.
--
-- These tables make program pages fully DB-driven. Without them, pages
-- must import static TS files for curriculum, CTAs, media, and enrollment
-- tracks — creating a split source of truth.
--
-- All tables use IF NOT EXISTS and safe defaults. No destructive ops.

-- ── 1. program_curriculum_modules ────────────────────────────────────────────
-- Curriculum modules displayed on program detail pages.
-- topics stored as JSONB array of strings.

CREATE TABLE IF NOT EXISTS public.program_curriculum_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  topics       JSONB NOT NULL DEFAULT '[]',   -- string[]
  module_order INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcm_program_id
  ON public.program_curriculum_modules(program_id, module_order);

-- ── 2. program_enrollment_tracks ─────────────────────────────────────────────
-- Funded and self-pay enrollment tracks per program.
-- track_type: 'funded' | 'self_pay' | 'employer_paid' | 'partner'

CREATE TABLE IF NOT EXISTS public.program_enrollment_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  track_type       TEXT NOT NULL CHECK (track_type IN ('funded', 'self_pay', 'employer_paid', 'partner')),
  label            TEXT NOT NULL,
  requirement      TEXT,                    -- eligibility requirement string
  cost             TEXT,                    -- display string e.g. '$5,000'
  description      TEXT,
  apply_href       TEXT,
  available        BOOLEAN DEFAULT TRUE,
  coming_soon_msg  TEXT,
  track_order      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
  UNIQUE (program_id, track_type)
);

CREATE INDEX IF NOT EXISTS idx_pet_program_id
  ON public.program_enrollment_tracks(program_id, track_order);

-- ── 3. program_ctas ──────────────────────────────────────────────────────────
-- CTA hrefs per program. One row per program (upsert pattern).
-- Separate from enrollment_tracks — these are page-level navigation CTAs.

CREATE TABLE IF NOT EXISTS public.program_ctas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID NOT NULL UNIQUE REFERENCES public.programs(id) ON DELETE CASCADE,
  apply_href          TEXT,
  enroll_href         TEXT,
  request_info_href   TEXT,
  career_connect_href TEXT,
  advisor_href        TEXT,
  course_href         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. program_media ─────────────────────────────────────────────────────────
-- Hero media and thumbnail per program. One row per program.

CREATE TABLE IF NOT EXISTS public.program_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL UNIQUE REFERENCES public.programs(id) ON DELETE CASCADE,
  hero_image      TEXT,       -- path e.g. /images/pages/hvac-unit.jpg
  hero_image_alt  TEXT,
  video_src       TEXT,       -- path e.g. /videos/hvac-hero-final.mp4
  voiceover_src   TEXT,
  thumbnail       TEXT,
  badge_text      TEXT,       -- e.g. 'Grant Funded'
  badge_color     TEXT,       -- 'green' | 'orange' | 'red' | 'blue'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Verify ────────────────────────────────────────────────────────────────
-- After applying, confirm tables exist:
--
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'program_curriculum_modules','program_enrollment_tracks',
--     'program_ctas','program_media'
--   )
-- ORDER BY tablename;
