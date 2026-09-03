-- Course factory schema extension
-- Adds fields needed for the full course-launch workflow

-- Extend training_courses with missing operational fields
ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'review', 'published', 'archived')) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS promo_video_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificate_title TEXT,
  ADD COLUMN IF NOT EXISTS certificate_template_id UUID,
  ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Slug uniqueness (nullable slugs are allowed during draft)
CREATE UNIQUE INDEX IF NOT EXISTS training_courses_slug_unique
  ON training_courses (slug)
  WHERE slug IS NOT NULL;

-- Sync is_published with status for backward compatibility
CREATE OR REPLACE FUNCTION sync_course_published_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' THEN
    NEW.is_published := true;
    IF NEW.published_at IS NULL THEN
      NEW.published_at := NOW();
    END IF;
  ELSIF NEW.status IN ('draft', 'review', 'archived') THEN
    NEW.is_published := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_course_published ON training_courses;
CREATE TRIGGER trg_sync_course_published
  BEFORE INSERT OR UPDATE ON training_courses
  FOR EACH ROW EXECUTE FUNCTION sync_course_published_status();

-- Course audit log table
CREATE TABLE IF NOT EXISTS course_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'published', 'unpublished', 'archived',
    'lesson_added', 'lesson_removed', 'quiz_added', 'quiz_removed',
    'certificate_settings_changed'
  )),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS course_audit_log_course_id_idx ON course_audit_log (course_id);
CREATE INDEX IF NOT EXISTS course_audit_log_created_at_idx ON course_audit_log (created_at DESC);

-- RLS: admins and staff can read audit log; only service role writes
ALTER TABLE course_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_audit_log_admin_read" ON course_audit_log;
CREATE POLICY "course_audit_log_admin_read" ON course_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'org_admin', 'staff')
    )
  );
