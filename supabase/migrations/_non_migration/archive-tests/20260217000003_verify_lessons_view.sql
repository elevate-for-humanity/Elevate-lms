-- Verify and fix lessons VIEW + enrollments VIEW course_id fallback
-- The lessons VIEW depends on columns added to training_lessons.
-- The enrollments VIEW has a broken COALESCE fallback for course_id.

-- Ensure required columns exist on training_lessons
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS course_id_uuid UUID;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill order_index from lesson_number where missing
UPDATE training_lessons SET order_index = lesson_number WHERE order_index = 0 AND lesson_number IS NOT NULL;

-- Drop and recreate lessons VIEW to ensure correct column set
DROP VIEW IF EXISTS lessons CASCADE;

CREATE VIEW lessons AS
SELECT
  id,
  COALESCE(course_id_uuid, id) AS course_id,
  title,
  content,
  video_url,
  lesson_number,
  order_index,
  duration_minutes,
  is_required,
  is_published,
  created_at,
  updated_at
FROM training_lessons;

-- Make lessons VIEW writable
CREATE OR REPLACE RULE lessons_insert AS ON INSERT TO lessons
DO INSTEAD INSERT INTO training_lessons (
  course_id_uuid, title, content, video_url, lesson_number, order_index, duration_minutes, is_required, is_published
) VALUES (
  NEW.course_id, NEW.title, NEW.content, NEW.video_url, NEW.lesson_number, NEW.order_index, NEW.duration_minutes, NEW.is_required, NEW.is_published
);

CREATE OR REPLACE RULE lessons_update AS ON UPDATE TO lessons
DO INSTEAD UPDATE training_lessons SET
  title = NEW.title,
  content = NEW.content,
  video_url = NEW.video_url,
  lesson_number = NEW.lesson_number,
  order_index = NEW.order_index,
  duration_minutes = NEW.duration_minutes,
  is_required = NEW.is_required,
  is_published = NEW.is_published,
  updated_at = NOW()
WHERE id = OLD.id;

CREATE OR REPLACE RULE lessons_delete AS ON DELETE TO lessons
DO INSTEAD DELETE FROM training_lessons WHERE id = OLD.id;

-- ============================================================
-- Fix enrollments VIEW: course_id should be NULL not the enrollment's own id
-- ============================================================
DROP VIEW IF EXISTS enrollments CASCADE;

CREATE VIEW enrollments AS
SELECT
  id,
  user_id,
  course_id_uuid AS course_id,
  status,
  progress,
  at_risk,
  enrolled_at,
  started_at,
  completed_at,
  certificate_issued_at,
  tenant_id,
  created_at,
  updated_at
FROM training_enrollments;

-- Make enrollments VIEW writable
CREATE OR REPLACE RULE enrollments_insert AS ON INSERT TO enrollments
DO INSTEAD INSERT INTO training_enrollments (
  user_id, course_id_uuid, status, progress, at_risk, enrolled_at, started_at, tenant_id
) VALUES (
  NEW.user_id, NEW.course_id, NEW.status, COALESCE(NEW.progress, 0), NEW.at_risk, COALESCE(NEW.enrolled_at, NOW()), NEW.started_at, NEW.tenant_id
);

CREATE OR REPLACE RULE enrollments_update AS ON UPDATE TO enrollments
DO INSTEAD UPDATE training_enrollments SET
  status = NEW.status,
  progress = NEW.progress,
  at_risk = NEW.at_risk,
  started_at = NEW.started_at,
  completed_at = NEW.completed_at,
  certificate_issued_at = NEW.certificate_issued_at,
  updated_at = NOW()
WHERE id = OLD.id;

CREATE OR REPLACE RULE enrollments_delete AS ON DELETE TO enrollments
DO INSTEAD DELETE FROM training_enrollments WHERE id = OLD.id;
