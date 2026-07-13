-- Migrate FK constraints from training_courses → courses (canonical table).
--
-- Tables with FKs to training_courses (found via pg_constraint):
--   course_audit_log, course_discussions, modules,
--   program_holder_courses, scorm_packages
--
-- training_lessons.course_id FK is intentionally left pointing to
-- training_courses (it is the HVAC read-only archive).
--
-- For modules: 26 rows referenced training_courses IDs not in courses.
-- Those rows are copied into courses first (with slug = 'tc-' || id).

-- 1. Copy training_courses rows referenced by modules into courses
INSERT INTO courses (
  id, title, slug, description, status, is_active,
  program_id, thumbnail_url, duration_hours, created_at, updated_at
)
SELECT
  tc.id,
  COALESCE(tc.title, tc.course_name, 'Untitled'),
  'tc-' || tc.id::text,
  tc.description,
  CASE WHEN tc.is_published THEN 'published'::course_status ELSE 'draft'::course_status END,
  COALESCE(tc.is_active, tc.is_published, false),
  tc.program_id,
  tc.thumbnail_url,
  tc.duration_hours,
  tc.created_at,
  tc.updated_at
FROM training_courses tc
JOIN modules m ON m.course_id = tc.id
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.id = tc.id)
ON CONFLICT (id) DO NOTHING;

-- 2. Migrate FKs (all empty tables except modules)
ALTER TABLE course_audit_log
  DROP CONSTRAINT IF EXISTS course_audit_log_course_id_fkey,
  ADD CONSTRAINT course_audit_log_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE course_discussions
  DROP CONSTRAINT IF EXISTS course_discussions_course_id_fkey,
  ADD CONSTRAINT course_discussions_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE program_holder_courses
  DROP CONSTRAINT IF EXISTS program_holder_courses_course_id_fkey,
  ADD CONSTRAINT program_holder_courses_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE scorm_packages
  DROP CONSTRAINT IF EXISTS scorm_packages_course_id_fkey,
  ADD CONSTRAINT scorm_packages_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE modules
  DROP CONSTRAINT IF EXISTS modules_course_id_fkey,
  ADD CONSTRAINT modules_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
