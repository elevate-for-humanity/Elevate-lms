-- program_holder_courses v2
--
-- Adds:
--   1. term/cohort dates so teaching assignments are time-bounded
--   2. a trigger that keeps program_id in sync with training_courses.program_id
--      so the denormalized column cannot drift
--   3. storage bucket for syllabi
--   4. storage policies scoped to the uploading holder's uid folder

-- ── 1. Term dates ─────────────────────────────────────────────────────────────

ALTER TABLE program_holder_courses
  ADD COLUMN IF NOT EXISTS term_name   text,
  ADD COLUMN IF NOT EXISTS start_date  date,
  ADD COLUMN IF NOT EXISTS end_date    date;

COMMENT ON COLUMN program_holder_courses.term_name IS
  'Human-readable cohort label, e.g. "Spring 2025 Cohort 1".';
COMMENT ON COLUMN program_holder_courses.start_date IS
  'First day of instruction for this teaching assignment.';
COMMENT ON COLUMN program_holder_courses.end_date IS
  'Last day of instruction. NULL = open-ended / self-paced.';

-- Prevent end_date before start_date
ALTER TABLE program_holder_courses
  DROP CONSTRAINT IF EXISTS chk_phc_dates;
ALTER TABLE program_holder_courses
  ADD CONSTRAINT chk_phc_dates
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- ── 2. program_id consistency trigger ────────────────────────────────────────
--
-- program_id on program_holder_courses is denormalized for query convenience.
-- This trigger overwrites it with training_courses.program_id on every INSERT
-- or UPDATE so it can never drift from the course's actual program.

CREATE OR REPLACE FUNCTION sync_phc_program_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT program_id
    INTO NEW.program_id
    FROM training_courses
   WHERE id = NEW.course_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_phc_sync_program_id ON program_holder_courses;
CREATE TRIGGER trg_phc_sync_program_id
  BEFORE INSERT OR UPDATE OF course_id
  ON program_holder_courses
  FOR EACH ROW EXECUTE FUNCTION sync_phc_program_id();

-- ── 3. Storage bucket for syllabi ─────────────────────────────────────────────
--
-- Files are stored at: {auth.uid()}/{program_holder_courses.id}/{filename}
-- The bucket is private — no public URLs. Signed URLs are generated server-side.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'program-holder-syllabi',
  'program-holder-syllabi',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── 4. Storage policies ───────────────────────────────────────────────────────

-- Holders upload into their own uid-prefixed folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'program holders upload own syllabi'
  ) THEN
    CREATE POLICY "program holders upload own syllabi"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'program-holder-syllabi'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;
END $$;

-- Holders read their own files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'program holders read own syllabi'
  ) THEN
    CREATE POLICY "program holders read own syllabi"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'program-holder-syllabi'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;
END $$;

-- Holders can replace (update) their own files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'program holders update own syllabi'
  ) THEN
    CREATE POLICY "program holders update own syllabi"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'program-holder-syllabi'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;
END $$;

-- Admin and staff can read all syllabi for review
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'admin read all syllabi'
  ) THEN
    CREATE POLICY "admin read all syllabi"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'program-holder-syllabi'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'staff')
        )
      );
  END IF;
END $$;

-- Service role full access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'service role manages syllabi'
  ) THEN
    CREATE POLICY "service role manages syllabi"
      ON storage.objects FOR ALL TO service_role
      USING (bucket_id = 'program-holder-syllabi')
      WITH CHECK (bucket_id = 'program-holder-syllabi');
  END IF;
END $$;
