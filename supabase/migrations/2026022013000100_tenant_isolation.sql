-- ============================================================================
-- PHASE 1: TENANT ISOLATION — Add tenant_id to core LMS tables
-- ============================================================================
-- NOTE: "courses" and "lessons" are VIEWS on training_courses / training_lessons.
--       We ALTER the base tables, then recreate the views to include tenant_id.
-- ============================================================================

-- 1. training_courses (43 rows) — base table for "courses" view
ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_training_courses_tenant_id ON training_courses(tenant_id);

-- 2. training_lessons (514 rows) — base table for "lessons" view
ALTER TABLE training_lessons
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_training_lessons_tenant_id ON training_lessons(tenant_id);

-- 3. modules (21 rows)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'modules' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE modules ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_modules_tenant_id ON modules(tenant_id);
  END IF;
END $$;

-- 4. assignments (5 rows)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'assignments' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE assignments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_assignments_tenant_id ON assignments(tenant_id);
  END IF;
END $$;

-- 5. grades (0 rows)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'grades' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE grades ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_grades_tenant_id ON grades(tenant_id);
  END IF;
END $$;

-- 6. job_placements (0 rows)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'job_placements' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE job_placements ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_job_placements_tenant_id ON job_placements(tenant_id);
  END IF;
END $$;

-- 7. notifications (0 rows)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'notifications' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
    CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
  END IF;
END $$;

-- 8. Recreate "courses" view to include tenant_id
-- Original view aliases course_name as title and hides program_id
DROP VIEW IF EXISTS courses;
CREATE VIEW courses AS
SELECT
  id,
  course_name,
  course_name AS title,
  course_code,
  description,
  duration_hours,
  price,
  is_active,
  instructor_id,
  created_at,
  updated_at,
  tenant_id
FROM training_courses;

-- 9. Recreate "lessons" view to include tenant_id
DROP VIEW IF EXISTS lessons;
CREATE VIEW lessons AS
SELECT
  id,
  course_id,
  lesson_number,
  title,
  content,
  video_url,
  duration_minutes,
  topics,
  quiz_questions,
  created_at,
  updated_at,
  course_id_uuid,
  order_index,
  is_required,
  is_published,
  content_type,
  quiz_id,
  passing_score,
  description,
  tenant_id
FROM training_lessons;
