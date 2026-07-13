-- program_holder_courses
--
-- Links a program holder to the specific course(s) they are teaching,
-- with syllabus upload and per-course status tracking.
--
-- Separate from program_holder_programs (which links holder → program catalog
-- entry). A program can have multiple courses; this table tracks which course
-- instance the holder is actually delivering.
--
-- teaches_multiple on program_holders: set during onboarding when the holder
-- indicates they are teaching more than one course. Drives the UI question
-- "Are you teaching multiple courses?" and controls whether the onboarding
-- flow collects one or many course assignments.

-- ── 1. teaches_multiple flag on program_holders ───────────────────────────────

ALTER TABLE program_holders
  ADD COLUMN IF NOT EXISTS teaches_multiple boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN program_holders.teaches_multiple IS
  'Set during onboarding. True when the holder is teaching more than one course. '
  'Controls whether the course-assignment step collects one or multiple courses.';

-- ── 2. program_holder_courses ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS program_holder_courses (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The holder teaching this course
  program_holder_id   uuid        NOT NULL,
    REFERENCES program_holders(id) ON DELETE CASCADE,

  -- The course being taught (training_courses is the canonical course table)
  course_id           uuid        NOT NULL,
    REFERENCES training_courses(id) ON DELETE CASCADE,

  -- The program this course belongs to (denormalized for query convenience;
  -- must match training_courses.program_id when that column exists)
  program_id          uuid,
    REFERENCES programs(id) ON DELETE SET NULL,

  -- Syllabus the holder uploaded for this course
  syllabus_url        text,
  syllabus_filename   text,
  syllabus_uploaded_at timestamptz,

  -- Onboarding / approval state for this course assignment
  status              text        NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),

  -- Free-text notes from admin review
  review_notes        text,
  reviewed_by         uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()

  -- One holder can only be assigned to a given course once
  UNIQUE (program_holder_id, course_id)
);

-- ── 3. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_phc_holder
  ON program_holder_courses (program_holder_id);

CREATE INDEX IF NOT EXISTS idx_phc_course
  ON program_holder_courses (course_id);

CREATE INDEX IF NOT EXISTS idx_phc_program
  ON program_holder_courses (program_id)
  WHERE program_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_phc_status
  ON program_holder_courses (status)
  WHERE status != 'approved';

-- ── 4. updated_at trigger ─────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_phc_updated_at ON program_holder_courses;
CREATE TRIGGER trg_phc_updated_at
  BEFORE UPDATE ON program_holder_courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE program_holder_courses ENABLE ROW LEVEL SECURITY;

-- Program holders can read and manage their own course assignments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'program_holder_courses'
      AND policyname = 'holder own courses'
  ) THEN
    CREATE POLICY "holder own courses"
      ON program_holder_courses
      FOR ALL
      TO authenticated
      USING (
        program_holder_id IN (
          SELECT id FROM program_holders WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        program_holder_id IN (
          SELECT id FROM program_holders WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Admin and staff can read all
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'program_holder_courses'
      AND policyname = 'admin read all'
  ) THEN
    CREATE POLICY "admin read all"
      ON program_holder_courses
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'staff')
        )
      );
  END IF;
END $$;

-- Service role bypasses RLS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'program_holder_courses'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all"
      ON program_holder_courses
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
