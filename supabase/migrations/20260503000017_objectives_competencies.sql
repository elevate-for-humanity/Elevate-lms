-- Migration: course/module/lesson objectives and competency mapping tables
--
-- Adds canonical tables for structured learning objectives and competency
-- mappings. These are required by the publish auditor — a course cannot
-- publish without objectives at every level.
--
-- Apply in Supabase Dashboard → SQL Editor after 20260503000016.

-- ── 1. course_objectives ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_objectives (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  objective_text TEXT        NOT NULL CHECK (LENGTH(TRIM(objective_text)) >= 5),
  order_index    INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_objectives_course_id ON public.course_objectives(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_objectives_order
  ON public.course_objectives(course_id, order_index);

-- ── 2. module_objectives ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_objectives (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id      UUID        NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  objective_text TEXT        NOT NULL CHECK (LENGTH(TRIM(objective_text)) >= 5),
  order_index    INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_objectives_module_id ON public.module_objectives(module_id);

-- ── 3. lesson_objectives ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lesson_objectives (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      UUID        NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  objective_text TEXT        NOT NULL CHECK (LENGTH(TRIM(objective_text)) >= 5),
  order_index    INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_objectives_lesson_id ON public.lesson_objectives(lesson_id);

-- ── 4. course_competencies ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_competencies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code        TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, code)
);

CREATE INDEX IF NOT EXISTS idx_course_competencies_course_id ON public.course_competencies(course_id);

-- ── 5. module_competencies ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_competencies (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID        NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  competency_code  TEXT        NOT NULL,
  label            TEXT        NOT NULL,
  description      TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, competency_code)
);

CREATE INDEX IF NOT EXISTS idx_module_competencies_module_id ON public.module_competencies(module_id);

-- ── 6. lesson_competency_map ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lesson_competency_map (
  lesson_id       UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  competency_code TEXT NOT NULL,
  PRIMARY KEY (lesson_id, competency_code)
);

CREATE INDEX IF NOT EXISTS idx_lesson_competency_map_lesson_id
  ON public.lesson_competency_map(lesson_id);

-- ── 7. course_accreditation_metadata ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_accreditation_metadata (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id                   UUID        NOT NULL UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
  accreditation_body          TEXT,
  regulatory_mode             TEXT        NOT NULL DEFAULT 'workforce',
  delivery_model              TEXT        NOT NULL DEFAULT 'hybrid',
  required_clock_hours        NUMERIC     NOT NULL DEFAULT 0,
  requires_final_exam         BOOLEAN     NOT NULL DEFAULT false,
  requires_practical          BOOLEAN     NOT NULL DEFAULT false,
  requires_video_transcript   BOOLEAN     NOT NULL DEFAULT false,
  certificate_requires_practical BOOLEAN NOT NULL DEFAULT false,
  min_passing_score           INTEGER     NOT NULL DEFAULT 70,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 8. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.course_objectives           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_objectives           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_objectives           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_competencies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_competencies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_competency_map       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_accreditation_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role all" ON public.course_objectives           USING (auth.role()='service_role');
CREATE POLICY "Service role all" ON public.module_objectives           USING (auth.role()='service_role');
CREATE POLICY "Service role all" ON public.lesson_objectives           USING (auth.role()='service_role');
CREATE POLICY "Service role all" ON public.course_competencies         USING (auth.role()='service_role');
CREATE POLICY "Service role all" ON public.module_competencies         USING (auth.role()='service_role');
CREATE POLICY "Service role all" ON public.lesson_competency_map       USING (auth.role()='service_role');
CREATE POLICY "Service role all" ON public.course_accreditation_metadata USING (auth.role()='service_role');

CREATE POLICY "Authenticated read" ON public.course_objectives
  FOR SELECT USING (auth.role() IN ('authenticated','service_role'));
CREATE POLICY "Authenticated read" ON public.module_objectives
  FOR SELECT USING (auth.role() IN ('authenticated','service_role'));
CREATE POLICY "Authenticated read" ON public.lesson_objectives
  FOR SELECT USING (auth.role() IN ('authenticated','service_role'));
CREATE POLICY "Authenticated read" ON public.course_competencies
  FOR SELECT USING (auth.role() IN ('authenticated','service_role'));
CREATE POLICY "Authenticated read" ON public.module_competencies
  FOR SELECT USING (auth.role() IN ('authenticated','service_role'));
CREATE POLICY "Authenticated read" ON public.lesson_competency_map
  FOR SELECT USING (auth.role() IN ('authenticated','service_role'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_objectives           TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_objectives           TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_objectives           TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_competencies         TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_competencies         TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_competency_map       TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_accreditation_metadata TO service_role;
GRANT SELECT ON public.course_objectives           TO authenticated;
GRANT SELECT ON public.module_objectives           TO authenticated;
GRANT SELECT ON public.lesson_objectives           TO authenticated;
GRANT SELECT ON public.course_competencies         TO authenticated;
GRANT SELECT ON public.module_competencies         TO authenticated;
GRANT SELECT ON public.lesson_competency_map       TO authenticated;
