-- Syllabus separation: universal course vs. holder delivery plan
--
-- training_courses: optional default/placeholder syllabus only.
--   The universal course definition is not overwritten by holder uploads.
--
-- program_holder_courses: holder-specific delivery syllabus + alignment review.
--   Holders customize delivery structure; credential requirements stay fixed.
--
-- Renames the existing syllabus_url/syllabus_filename columns on
-- program_holder_courses to custom_syllabus_* to make the separation explicit.
-- The old column names are dropped after renaming so no data is lost.

-- ── 1. training_courses: default syllabus placeholders ────────────────────────

ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS default_syllabus_url      text,
  ADD COLUMN IF NOT EXISTS default_syllabus_filename text;

COMMENT ON COLUMN training_courses.default_syllabus_url IS
  'Optional placeholder syllabus for this course. Used as fallback display only. '
  'Never overwritten by holder uploads — holder syllabi live on program_holder_courses.';
COMMENT ON COLUMN training_courses.default_syllabus_filename IS
  'Display filename for default_syllabus_url.';

-- ── 2. program_holder_courses: rename syllabus columns ───────────────────────
--
-- syllabus_url → custom_syllabus_url
-- syllabus_filename → custom_syllabus_filename
-- syllabus_uploaded_at → custom_syllabus_uploaded_at
--
-- IF the old columns exist, rename them. IF they were never created (fresh env),
-- the ADD COLUMN IF NOT EXISTS below handles it.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'program_holder_courses'
      AND column_name = 'syllabus_url'
  ) THEN
    ALTER TABLE program_holder_courses
      RENAME COLUMN syllabus_url TO custom_syllabus_url;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'program_holder_courses'
      AND column_name = 'syllabus_filename'
  ) THEN
    ALTER TABLE program_holder_courses
      RENAME COLUMN syllabus_filename TO custom_syllabus_filename;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'program_holder_courses'
      AND column_name = 'syllabus_uploaded_at'
  ) THEN
    ALTER TABLE program_holder_courses
      RENAME COLUMN syllabus_uploaded_at TO custom_syllabus_uploaded_at;
  END IF;
END $$;

-- Ensure columns exist under new names (handles fresh environments)
ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS custom_syllabus_url          text,
  ADD COLUMN IF NOT EXISTS custom_syllabus_filename     text,
  ADD COLUMN IF NOT EXISTS custom_syllabus_uploaded_at  timestamptz;

-- ── 3. program_holder_courses: custom structure flags ────────────────────────

ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS uses_custom_structure      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_structure_notes   text;

COMMENT ON COLUMN program_holder_courses.uses_custom_structure IS
  'True when the holder has uploaded their own delivery syllabus. '
  'Does not affect the fixed credential requirements or competency map.';
COMMENT ON COLUMN program_holder_courses.delivery_structure_notes IS
  'Free-text notes from the holder about their delivery approach, pacing, or format.';

-- ── 4. program_holder_courses: credential alignment review ───────────────────
--
-- Admin reviews whether the holder's custom syllabus still covers the required
-- credential competencies. Separate from the general status workflow.

ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS credential_alignment_status      text NOT NULL DEFAULT 'pending'
    CHECK (credential_alignment_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS credential_alignment_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS credential_alignment_notes       text;

COMMENT ON COLUMN program_holder_courses.credential_alignment_status IS
  'Whether admin has confirmed the holder syllabus covers required credential competencies. '
  'pending = not yet reviewed. approved = aligned. rejected = gaps found.';

-- ── 5. Index on credential_alignment_status for admin review queue ────────────

CREATE INDEX IF NOT EXISTS idx_phc_alignment_status
  ON program_holder_courses (credential_alignment_status)
  WHERE credential_alignment_status != 'approved';
