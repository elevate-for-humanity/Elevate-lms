-- =============================================================================
-- curriculum_lesson_plans + competency_exam_profiles
--
-- Single migration — no dependency reason to split.
-- Execution order:
--   1. curriculum_lesson_plans  (new table — must exist before FK below)
--   2. ALTER curriculum_lessons (add competency_keys, lesson_plan_id FK)
--   3. competency_exam_profiles (standalone)
--   4. RLS policies
--   5. updated_at triggers
-- =============================================================================

-- ─── 1. curriculum_lesson_plans ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS curriculum_lesson_plans (
  id                         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id                 uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  lesson_slug                text        NOT NULL,
  lesson_title               text        NOT NULL,
  learning_objective         text        NOT NULL,
  cognitive_level            text        NOT NULL,
    CHECK (cognitive_level IN ('remember','understand','apply','analyze','evaluate','create')),
  primary_competency_key     text        NOT NULL,
  supporting_competency_keys text[]      NOT NULL DEFAULT '{}',
  key_concepts               text[]      NOT NULL DEFAULT '{}',
  required_distinctions      text[]      NOT NULL DEFAULT '{}',
  avoided_misconceptions     text[]      NOT NULL DEFAULT '{}',
  exam_domain                text,
  exam_subdomain             text,
  estimated_minutes          int         NOT NULL DEFAULT 15,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
  UNIQUE (program_id, lesson_slug)
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_program_id
  ON curriculum_lesson_plans (program_id);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_primary_competency
  ON curriculum_lesson_plans (primary_competency_key);

-- ─── 2. Extend curriculum_lessons ────────────────────────────────────────────

ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS competency_keys text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lesson_plan_id  uuid   REFERENCES curriculum_lesson_plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_competency_keys
  ON curriculum_lessons USING GIN (competency_keys);

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_lesson_plan_id
  ON curriculum_lessons (lesson_plan_id)
  WHERE lesson_plan_id IS NOT NULL;

-- ─── 3. competency_exam_profiles ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS competency_exam_profiles (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_key         text        NOT NULL UNIQUE,
  competency_name        text        NOT NULL,
  program_slug           text        NOT NULL,
  must_assess            boolean     NOT NULL DEFAULT true,
  exam_domain            text        NOT NULL,
  exam_subdomain         text,
  required_phrases       text[]      NOT NULL,
  CONSTRAINT chk_required_phrases_min CHECK (array_length(required_phrases, 1) >= 2),
  requires_distinction   boolean     NOT NULL DEFAULT false,
  distinction_side_a     text[]      NOT NULL DEFAULT '{}',
  distinction_side_b     text[]      NOT NULL DEFAULT '{}',
  distinction_label      text,
  distractor_phrases     text[]      NOT NULL DEFAULT '{}',
  distractor_explanation text        NOT NULL DEFAULT '',
  cognitive_operation    text        NOT NULL,
  response_depth         text        NOT NULL,
    CHECK (response_depth IN ('surface','conceptual','applied','analytical')),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_profiles_program_slug
  ON competency_exam_profiles (program_slug);

CREATE INDEX IF NOT EXISTS idx_exam_profiles_must_assess
  ON competency_exam_profiles (program_slug, must_assess)
  WHERE must_assess = true;

-- ─── 4. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE curriculum_lesson_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_exam_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='curriculum_lesson_plans' AND policyname='authenticated read lesson plans') THEN
    CREATE POLICY "authenticated read lesson plans" ON curriculum_lesson_plans FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='competency_exam_profiles' AND policyname='authenticated read exam profiles') THEN
    CREATE POLICY "authenticated read exam profiles" ON competency_exam_profiles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ─── 5. updated_at triggers ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_plans_updated_at  ON curriculum_lesson_plans;
DROP TRIGGER IF EXISTS trg_exam_profiles_updated_at ON competency_exam_profiles;

CREATE TRIGGER trg_lesson_plans_updated_at
  BEFORE UPDATE ON curriculum_lesson_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_exam_profiles_updated_at
  BEFORE UPDATE ON competency_exam_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
