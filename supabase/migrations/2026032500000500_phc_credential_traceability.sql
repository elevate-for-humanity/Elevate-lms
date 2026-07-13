-- program_holder_courses: credential traceability
--
-- Adds credential_id so every course assignment explicitly names the credential
-- it prepares for. This is the anchor for alignment review: admin can confirm
-- the holder's custom syllabus covers the required exam domains without joining
-- through training_courses.
--
-- The column is nullable on add so existing rows are not broken. A trigger
-- backfills it from training_courses.credential_id on INSERT/UPDATE of course_id,
-- mirroring the existing sync_phc_program_id pattern.
--
-- Once backfilled, a NOT NULL constraint can be added in a follow-up migration
-- after verifying all rows have a value.

-- ── 1. Add credential_id column ───────────────────────────────────────────────

ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS credential_id uuid
    REFERENCES credential_registry(id) ON DELETE SET NULL;

COMMENT ON COLUMN program_holder_courses.credential_id IS
  'The credential this course assignment prepares for. '
  'Backfilled from training_courses.credential_id via trigger. '
  'Used for alignment review without joining through training_courses.';

CREATE INDEX IF NOT EXISTS idx_phc_credential
  ON program_holder_courses (credential_id)
  WHERE credential_id IS NOT NULL;

-- ── 2. Sync trigger: keep credential_id in step with course_id ────────────────
--
-- Fires on INSERT and on UPDATE of course_id. Reads credential_id from
-- training_courses so it can never drift from the course's actual credential.
-- If training_courses has no credential_id column yet, the trigger sets NULL
-- rather than erroring — safe for environments where that column is pending.

CREATE OR REPLACE FUNCTION sync_phc_credential_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    SELECT credential_id
      INTO NEW.credential_id
      FROM training_courses
     WHERE id = NEW.course_id;
  EXCEPTION WHEN undefined_column THEN
    -- training_courses.credential_id not yet added; leave NULL
    NEW.credential_id := NULL;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_phc_sync_credential_id ON program_holder_courses;
CREATE TRIGGER trg_phc_sync_credential_id
  BEFORE INSERT OR UPDATE OF course_id
  ON program_holder_courses
  FOR EACH ROW EXECUTE FUNCTION sync_phc_credential_id();

-- ── 3. Backfill existing rows ─────────────────────────────────────────────────
--
-- Only runs if training_courses has a credential_id column. Safe no-op otherwise.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'training_courses'
      AND column_name  = 'credential_id'
  ) THEN
    UPDATE program_holder_courses phc
       SET credential_id = tc.credential_id
      FROM training_courses tc
     WHERE phc.course_id     = tc.id
       AND phc.credential_id IS NULL;
  END IF;
END $$;
