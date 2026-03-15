-- Syllabus storage: use object paths instead of raw URLs
--
-- Raw URLs expire (signed) or leak bucket structure (public).
-- Storing bucket + path lets the server generate signed URLs on read
-- and keeps the data model durable.
--
-- Also tightens the status CHECK constraint and adds the credential
-- alignment review columns that were in migration 003 but used the
-- wrong field names.
--
-- Safe to run on a DB that already has migration 003 applied.

BEGIN;

-- ── 1. training_courses: default syllabus as path, not URL ───────────────────

-- Rename default_syllabus_url → default_syllabus_path if it exists as a URL column
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'training_courses'
      AND column_name = 'default_syllabus_url'
  ) THEN
    ALTER TABLE training_courses
      RENAME COLUMN default_syllabus_url TO default_syllabus_path;
  END IF;
END $$;

ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS default_syllabus_bucket   text,
  ADD COLUMN IF NOT EXISTS default_syllabus_path     text,
  ADD COLUMN IF NOT EXISTS default_syllabus_filename text;

COMMENT ON COLUMN training_courses.default_syllabus_bucket IS
  'Storage bucket for the universal course placeholder syllabus.';
COMMENT ON COLUMN training_courses.default_syllabus_path IS
  'Object path within the bucket. Generate signed URLs server-side on read. '
  'Never overwritten by holder uploads — holder syllabi live on program_holder_courses.';
COMMENT ON COLUMN training_courses.default_syllabus_filename IS
  'Display filename shown to holders before they upload their own.';

-- ── 2. program_holder_courses: replace URL column with bucket + path ──────────
--
-- Migration 003 may have already renamed syllabus_url → custom_syllabus_url.
-- We now rename that to custom_syllabus_path and add custom_syllabus_bucket.
-- If the column is still named syllabus_url (003 not yet applied), handle that too.

DO $$ BEGIN
  -- Case A: 003 was applied — custom_syllabus_url exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'program_holder_courses'
      AND column_name = 'custom_syllabus_url'
  ) THEN
    ALTER TABLE program_holder_courses
      RENAME COLUMN custom_syllabus_url TO custom_syllabus_path;
  END IF;

  -- Case B: 003 was NOT applied — original syllabus_url still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'program_holder_courses'
      AND column_name = 'syllabus_url'
  ) THEN
    ALTER TABLE program_holder_courses
      RENAME COLUMN syllabus_url TO custom_syllabus_path;
  END IF;
END $$;

-- Ensure all custom syllabus columns exist under canonical names
ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS custom_syllabus_bucket      text,
  ADD COLUMN IF NOT EXISTS custom_syllabus_path        text,
  ADD COLUMN IF NOT EXISTS custom_syllabus_filename    text,
  ADD COLUMN IF NOT EXISTS custom_syllabus_uploaded_at timestamptz;

COMMENT ON COLUMN program_holder_courses.custom_syllabus_bucket IS
  'Storage bucket for this holder''s delivery syllabus. Always ''program-holder-syllabi''.';
COMMENT ON COLUMN program_holder_courses.custom_syllabus_path IS
  'Object path: {uid}/{program_holder_courses.id}/{filename}. '
  'Generate signed URLs server-side. Never store raw signed URLs here.';
COMMENT ON COLUMN program_holder_courses.custom_syllabus_filename IS
  'Original filename shown in the admin review UI.';
COMMENT ON COLUMN program_holder_courses.custom_syllabus_uploaded_at IS
  'When the holder last uploaded a syllabus for this course assignment.';

-- ── 3. Custom structure flags (idempotent) ────────────────────────────────────

ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS uses_custom_structure    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_structure_notes text;

COMMENT ON COLUMN program_holder_courses.uses_custom_structure IS
  'True when the holder has uploaded their own delivery syllabus. '
  'Does not affect the fixed credential requirements or competency map.';
COMMENT ON COLUMN program_holder_courses.delivery_structure_notes IS
  'Holder notes on their delivery approach, pacing, or format differences '
  'from the universal course structure.';

-- ── 4. Credential alignment review ───────────────────────────────────────────
--
-- Admin confirms the holder''s custom syllabus still covers required competencies.
-- Separate from the general status workflow.

ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS credential_alignment_status      text NOT NULL DEFAULT 'pending'
    CHECK (credential_alignment_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS credential_alignment_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS credential_alignment_notes       text;

COMMENT ON COLUMN program_holder_courses.credential_alignment_status IS
  'Whether admin confirmed the holder syllabus covers required credential competencies. '
  'Resets to pending on every new upload.';

-- ── 5. Tighten status constraint ──────────────────────────────────────────────

ALTER TABLE program_holder_courses
  DROP CONSTRAINT IF EXISTS chk_program_holder_courses_status;
ALTER TABLE program_holder_courses
  DROP CONSTRAINT IF EXISTS program_holder_courses_status_check;

ALTER TABLE program_holder_courses
  ADD CONSTRAINT chk_phc_status
  CHECK (status IN ('pending', 'under_review', 'approved', 'rejected'));

-- ── 6. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_program_holder_courses_holder
  ON program_holder_courses (program_holder_id);

CREATE INDEX IF NOT EXISTS idx_program_holder_courses_course
  ON program_holder_courses (course_id);

CREATE INDEX IF NOT EXISTS idx_phc_alignment_status
  ON program_holder_courses (credential_alignment_status)
  WHERE credential_alignment_status != 'approved';

COMMIT;

-- ── Storage bucket + policies (run separately in Supabase Dashboard SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────
-- The statements below cannot run via exec_sql RPC because the service role
-- does not own storage.objects. Paste them into the Dashboard SQL editor once.
--
-- Path convention: {auth.uid()}/{program_holder_courses.id}/{filename}
-- The uid prefix is the only storage-layer enforcement. Ownership of the
-- course assignment row is verified in the API route before any DB write.
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'program-holder-syllabi',
--   'program-holder-syllabi',
--   false,
--   20971520,  -- 20 MB
--   ARRAY[
--     'application/pdf',
--     'application/msword',
--     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
--   ]
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   file_size_limit    = EXCLUDED.file_size_limit,
--   allowed_mime_types = EXCLUDED.allowed_mime_types;
--
-- -- Holders upload into their own uid-prefixed folder
-- CREATE POLICY "program holders upload own syllabi"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (
--     bucket_id = 'program-holder-syllabi'
--     AND split_part(name, '/', 1) = auth.uid()::text
--   );
--
-- -- Holders read their own files
-- CREATE POLICY "program holders read own syllabi"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'program-holder-syllabi'
--     AND split_part(name, '/', 1) = auth.uid()::text
--   );
--
-- -- Holders can replace their own files
-- CREATE POLICY "program holders update own syllabi"
--   ON storage.objects FOR UPDATE TO authenticated
--   USING (
--     bucket_id = 'program-holder-syllabi'
--     AND split_part(name, '/', 1) = auth.uid()::text
--   );
--
-- -- Admin and staff can read all syllabi for review
-- CREATE POLICY "admin read all syllabi"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'program-holder-syllabi'
--     AND EXISTS (
--       SELECT 1 FROM profiles
--       WHERE id = auth.uid()
--         AND role IN ('admin', 'super_admin', 'staff')
--     )
--   );
--
-- -- Service role full access (used by API routes)
-- CREATE POLICY "service role manages syllabi"
--   ON storage.objects FOR ALL TO service_role
--   USING (bucket_id = 'program-holder-syllabi')
--   WITH CHECK (bucket_id = 'program-holder-syllabi');
