-- Adds lightweight versioning to course_lessons.
--
-- Design: snapshot-on-publish, not full event sourcing.
-- When a lesson is published, the current state is snapshotted into
-- course_lesson_versions. The lesson row itself always holds the live state.
-- Rollback = copy a version snapshot back to the lesson row.
--
-- This gives:
--   - Full publish history per lesson
--   - One-step rollback to any prior published state
--   - Audit trail (who published, when)
--   - No impact on read performance (versions are a separate table)

-- ── 1. Add version tracking columns to course_lessons ────────────────────────

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS version          INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by     UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS previous_version_id UUID;  -- FK added after versions table exists

-- ── 2. Create course_lesson_versions snapshot table ───────────────────────────

CREATE TABLE IF NOT EXISTS public.course_lesson_versions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id           UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  version             INTEGER NOT NULL,

  -- Snapshot of the lesson state at publish time
  title               TEXT NOT NULL,
  lesson_type         TEXT NOT NULL,
  order_index         INTEGER,
  content             JSONB,
  rendered_html       TEXT,
  video_url           TEXT,
  video_config        JSONB,
  quiz_questions      JSONB,
  passing_score       INTEGER,
  practical_required  BOOLEAN,
  competency_checks   JSONB,
  learning_objectives JSONB,
  activities          JSONB,
  duration_minutes    INTEGER,
  instructor_notes    TEXT,
  status              TEXT,

  -- Audit
  published_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by        UUID REFERENCES auth.users(id),
  change_summary      TEXT          -- optional human note ("Fixed quiz question 3")
);

-- ── 3. Add FK from course_lessons.previous_version_id → course_lesson_versions ─

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'course_lessons_previous_version_fk'
      AND table_name = 'course_lessons'
  ) THEN
    ALTER TABLE public.course_lessons
      ADD CONSTRAINT course_lessons_previous_version_fk
      FOREIGN KEY (previous_version_id)
      REFERENCES public.course_lesson_versions(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. Index for fast version history lookup ──────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_course_lesson_versions_lesson_id
  ON public.course_lesson_versions (lesson_id, version DESC);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.course_lesson_versions ENABLE ROW LEVEL SECURITY;

-- Admins and instructors can read version history.
DROP POLICY IF EXISTS "lesson_versions_read" ON public.course_lesson_versions;
CREATE POLICY "lesson_versions_read"
  ON public.course_lesson_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- Only service role writes versions (via the publish API).
GRANT SELECT ON public.course_lesson_versions TO authenticated;
GRANT ALL    ON public.course_lesson_versions TO service_role;
GRANT SELECT ON public.course_lessons         TO authenticated;

