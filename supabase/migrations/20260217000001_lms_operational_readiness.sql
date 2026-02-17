-- ============================================================
-- LMS OPERATIONAL READINESS MIGRATION
-- Fixes all gaps identified in the operational audit:
--   1. Ensures enrollments/lessons VIEWs exist
--   2. Adds course_id to lesson_progress (API expects UUID, not course_slug)
--   3. Creates missing tables: lesson_completions, video_progress, lms_progress, module_certificates
--   4. Creates course_completion_status VIEW
--   5. Creates update_enrollment_progress_manual RPC
--   6. Creates calculate_course_progress function
--   7. Ensures certificates table has all columns used by API
--   8. Adds student RLS policies where missing
--
-- Safe to run repeatedly (all statements are idempotent).
-- Paste into Supabase Dashboard > SQL Editor > New Query > Run
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ENSURE VIEWS EXIST: enrollments, lessons, courses
--    These map to training_enrollments, training_lessons, training_courses
-- ============================================================

-- Add columns to training_enrollments that the enrollments VIEW API expects
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS at_risk BOOLEAN DEFAULT false;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS orientation_completed_at TIMESTAMPTZ;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS documents_submitted_at TIMESTAMPTZ;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS enrollment_method TEXT DEFAULT 'direct';
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS funding_source TEXT;
ALTER TABLE training_enrollments ADD COLUMN IF NOT EXISTS course_id_uuid UUID;

-- Add columns to training_courses that the courses VIEW API expects
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS duration_hours NUMERIC;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS program_id UUID;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS prerequisites UUID[];
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS instructor_id UUID;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill title from course_name if title is null
UPDATE training_courses SET title = course_name WHERE title IS NULL AND course_name IS NOT NULL;

-- Add columns to training_lessons that the lessons VIEW API expects
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS course_id_uuid UUID;  -- must exist before lessons VIEW
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill order_index from lesson_number
UPDATE training_lessons SET order_index = lesson_number WHERE order_index = 0 AND lesson_number IS NOT NULL;

-- Create/replace the enrollments VIEW
CREATE OR REPLACE VIEW enrollments AS
SELECT
  id,
  user_id,
  COALESCE(course_id_uuid, id) AS course_id,
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

-- Make enrollments VIEW updatable
CREATE OR REPLACE RULE enrollments_insert AS ON INSERT TO enrollments
DO INSTEAD INSERT INTO training_enrollments (
  user_id, course_id_uuid, status, progress, at_risk, enrolled_at, started_at, tenant_id
) VALUES (
  NEW.user_id, NEW.course_id, COALESCE(NEW.status, 'active'), COALESCE(NEW.progress, 0),
  COALESCE(NEW.at_risk, false), COALESCE(NEW.enrolled_at, NOW()), COALESCE(NEW.started_at, NOW()),
  NEW.tenant_id
) RETURNING id, user_id, course_id_uuid AS course_id, status, progress, at_risk,
  enrolled_at, started_at, completed_at, certificate_issued_at, tenant_id, created_at, updated_at;

CREATE OR REPLACE RULE enrollments_update AS ON UPDATE TO enrollments
DO INSTEAD UPDATE training_enrollments SET
  status = COALESCE(NEW.status, OLD.status),
  progress = COALESCE(NEW.progress, OLD.progress),
  at_risk = COALESCE(NEW.at_risk, OLD.at_risk),
  completed_at = NEW.completed_at,
  certificate_issued_at = NEW.certificate_issued_at,
  updated_at = COALESCE(NEW.updated_at, NOW())
WHERE id = OLD.id;

CREATE OR REPLACE RULE enrollments_delete AS ON DELETE TO enrollments
DO INSTEAD DELETE FROM training_enrollments WHERE id = OLD.id;

-- Create/replace the courses VIEW
CREATE OR REPLACE VIEW courses AS
SELECT
  id,
  COALESCE(title, course_name) AS title,
  course_name,
  course_id AS course_code,
  description,
  slug,
  duration_hours,
  price,
  is_active,
  is_published,
  program_id,
  prerequisites,
  instructor_id,
  metadata,
  created_at,
  updated_at
FROM training_courses;

-- Make courses VIEW updatable
CREATE OR REPLACE RULE courses_insert AS ON INSERT TO courses
DO INSTEAD INSERT INTO training_courses (
  title, description, slug, duration_hours, price, is_active, is_published,
  program_id, prerequisites, instructor_id, metadata
) VALUES (
  NEW.title, NEW.description, NEW.slug, NEW.duration_hours, NEW.price,
  COALESCE(NEW.is_active, true), COALESCE(NEW.is_published, false),
  NEW.program_id, NEW.prerequisites, NEW.instructor_id, COALESCE(NEW.metadata, '{}'::jsonb)
) RETURNING id, COALESCE(title, course_name) AS title, course_name,
  course_id AS course_code, description, slug, duration_hours, price,
  is_active, is_published, program_id, prerequisites, instructor_id, metadata,
  created_at, updated_at;

CREATE OR REPLACE RULE courses_update AS ON UPDATE TO courses
DO INSTEAD UPDATE training_courses SET
  title = COALESCE(NEW.title, OLD.title),
  description = COALESCE(NEW.description, OLD.description),
  slug = NEW.slug,
  duration_hours = NEW.duration_hours,
  price = NEW.price,
  is_active = COALESCE(NEW.is_active, OLD.is_active),
  is_published = COALESCE(NEW.is_published, OLD.is_published),
  program_id = NEW.program_id,
  instructor_id = NEW.instructor_id,
  metadata = COALESCE(NEW.metadata, OLD.metadata),
  updated_at = NOW()
WHERE id = OLD.id;

CREATE OR REPLACE RULE courses_delete AS ON DELETE TO courses
DO INSTEAD DELETE FROM training_courses WHERE id = OLD.id;

-- Create/replace the lessons VIEW
CREATE OR REPLACE VIEW lessons AS
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

-- Make lessons VIEW updatable
CREATE OR REPLACE RULE lessons_insert AS ON INSERT TO lessons
DO INSTEAD INSERT INTO training_lessons (
  course_id_uuid, title, content, video_url, order_index, duration_minutes, is_required, is_published
) VALUES (
  NEW.course_id, NEW.title, NEW.content, NEW.video_url,
  COALESCE(NEW.order_index, 0), NEW.duration_minutes,
  COALESCE(NEW.is_required, true), COALESCE(NEW.is_published, true)
) RETURNING id, course_id_uuid AS course_id, title, content, video_url,
  lesson_number, order_index, duration_minutes, is_required, is_published,
  created_at, updated_at;

CREATE OR REPLACE RULE lessons_update AS ON UPDATE TO lessons
DO INSTEAD UPDATE training_lessons SET
  title = COALESCE(NEW.title, OLD.title),
  content = NEW.content,
  video_url = NEW.video_url,
  order_index = COALESCE(NEW.order_index, OLD.order_index),
  duration_minutes = NEW.duration_minutes,
  is_required = COALESCE(NEW.is_required, OLD.is_required),
  is_published = COALESCE(NEW.is_published, OLD.is_published),
  updated_at = NOW()
WHERE id = OLD.id;

CREATE OR REPLACE RULE lessons_delete AS ON DELETE TO lessons
DO INSTEAD DELETE FROM training_lessons WHERE id = OLD.id;

-- ============================================================
-- 2. FIX lesson_progress SCHEMA
--    Table was created with course_slug TEXT but API writes course_id UUID
-- ============================================================

ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS last_position_seconds INTEGER DEFAULT 0;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS enrollment_id UUID;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create index on course_id
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON lesson_progress(user_id, course_id);

-- Drop old unique constraint and create new one that works with course_id
-- (The old one was user_id, course_slug, lesson_id)
DO $$ BEGIN
  ALTER TABLE lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_user_id_course_slug_lesson_id_key;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Add unique constraint on user_id, lesson_id (the API uses onConflict: 'user_id,lesson_id')
DO $$ BEGIN
  ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_user_lesson_unique UNIQUE (user_id, lesson_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. CREATE MISSING TABLES
-- ============================================================

-- 3a. lesson_completions (used by /api/student/progress, /api/learner/dashboard, /api/offline/sync)
CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID,
  module_id UUID,
  lesson_id UUID,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_course ON lesson_completions(user_id, course_id);

ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lc_own_select" ON lesson_completions;
CREATE POLICY "lc_own_select" ON lesson_completions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "lc_own_insert" ON lesson_completions;
CREATE POLICY "lc_own_insert" ON lesson_completions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "lc_own_update" ON lesson_completions;
CREATE POLICY "lc_own_update" ON lesson_completions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON lesson_completions TO authenticated;

-- 3b. video_progress (used by /api/courses/[courseId]/lessons/[lessonId]/progress, /api/video/progress)
CREATE TABLE IF NOT EXISTS video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  video_url TEXT,
  progress_seconds INTEGER DEFAULT 0,
  current_time INTEGER DEFAULT 0,
  duration INTEGER,
  completed BOOLEAN DEFAULT false,
  watch_count INTEGER DEFAULT 0,
  last_watched TIMESTAMPTZ DEFAULT NOW(),
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_video_progress_user ON video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_lesson ON video_progress(user_id, lesson_id);

ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vp_own_select" ON video_progress;
CREATE POLICY "vp_own_select" ON video_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "vp_own_upsert" ON video_progress;
CREATE POLICY "vp_own_upsert" ON video_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "vp_own_update" ON video_progress;
CREATE POLICY "vp_own_update" ON video_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON video_progress TO authenticated;

-- 3c. lms_progress (used by /api/lms/progress/start, /api/lms/progress/complete)
CREATE TABLE IF NOT EXISTS lms_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  course_slug TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  evidence_url TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_lms_progress_user ON lms_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_course ON lms_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_status ON lms_progress(status);

ALTER TABLE lms_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lmsp_own_select" ON lms_progress;
CREATE POLICY "lmsp_own_select" ON lms_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "lmsp_own_upsert" ON lms_progress;
CREATE POLICY "lmsp_own_upsert" ON lms_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "lmsp_own_update" ON lms_progress;
CREATE POLICY "lmsp_own_update" ON lms_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON lms_progress TO authenticated;

-- 3d. module_certificates (used by /api/lms/progress/complete)
CREATE TABLE IF NOT EXISTS module_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID,
  program_id UUID,
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_name TEXT NOT NULL,
  student_name TEXT,
  issued_by TEXT NOT NULL DEFAULT 'Elevate For Humanity',
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  certificate_url TEXT,
  verification_url TEXT,
  is_partner_cert BOOLEAN DEFAULT false,
  partner_course_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_module_certs_user ON module_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_module_certs_module ON module_certificates(module_id);

ALTER TABLE module_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mc_own_select" ON module_certificates;
CREATE POLICY "mc_own_select" ON module_certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "mc_service_insert" ON module_certificates;
CREATE POLICY "mc_service_insert" ON module_certificates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT ON module_certificates TO authenticated;

-- 3e. wioa_participant_records (used by /api/reports/wioa)
CREATE TABLE IF NOT EXISTS wioa_participant_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID,
  tenant_id UUID,
  program_id UUID,
  reporting_period_start DATE,
  reporting_period_end DATE,
  ssn_last4 TEXT,
  date_of_birth DATE,
  gender TEXT,
  race_ethnicity TEXT,
  veteran_status BOOLEAN DEFAULT false,
  disability_status BOOLEAN DEFAULT false,
  employment_status_at_entry TEXT,
  education_level_at_entry TEXT,
  program_entry_date DATE,
  program_exit_date DATE,
  employed_q2_after_exit BOOLEAN,
  employed_q4_after_exit BOOLEAN,
  median_earnings_q2 NUMERIC,
  credential_attained BOOLEAN DEFAULT false,
  measurable_skill_gain BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wioa_records_period ON wioa_participant_records(reporting_period_start, reporting_period_end);
CREATE INDEX IF NOT EXISTS idx_wioa_records_participant ON wioa_participant_records(participant_id);

ALTER TABLE wioa_participant_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wioa_admin_select" ON wioa_participant_records;
CREATE POLICY "wioa_admin_select" ON wioa_participant_records FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "wioa_service_all" ON wioa_participant_records;
CREATE POLICY "wioa_service_all" ON wioa_participant_records FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

GRANT SELECT ON wioa_participant_records TO authenticated;
GRANT ALL ON wioa_participant_records TO service_role;

-- 3f. employment_outcomes (used by /api/reports/wioa-quarterly)
CREATE TABLE IF NOT EXISTS employment_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID,
  program_id UUID,
  employer_name TEXT,
  job_title TEXT,
  employment_date DATE,
  hourly_wage NUMERIC,
  annual_salary NUMERIC,
  is_related_to_training BOOLEAN DEFAULT true,
  retention_q2 BOOLEAN,
  retention_q4 BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_user ON employment_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_employment_outcomes_date ON employment_outcomes(employment_date);

ALTER TABLE employment_outcomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eo_admin_select" ON employment_outcomes;
CREATE POLICY "eo_admin_select" ON employment_outcomes FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
GRANT SELECT ON employment_outcomes TO authenticated;

-- ============================================================
-- 4. ENSURE certificates TABLE HAS ALL COLUMNS USED BY API
--    System A uses: user_id, course_id, enrollment_id, certificate_number, issued_at
--    System C uses: student_id, course_id, program_id, certificate_number, verification_code,
--                   issued_date, student_name, course_title, program_name, hours_completed, issued_by
-- ============================================================

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS enrollment_id UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS program_id UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_number TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_date TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_title TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS hours_completed NUMERIC;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_by UUID;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS verification_url TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Sync user_id and student_id (they should be the same)
UPDATE certificates SET user_id = student_id WHERE user_id IS NULL AND student_id IS NOT NULL;
UPDATE certificates SET student_id = user_id WHERE student_id IS NULL AND user_id IS NOT NULL;

-- Create unique index on certificate_number if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_number_unique ON certificates(certificate_number) WHERE certificate_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);

-- ============================================================
-- 5. CREATE course_completion_status VIEW
-- ============================================================

CREATE OR REPLACE VIEW course_completion_status AS
SELECT
  e.user_id AS student_id,
  e.course_id,
  c.title AS course_title,
  COUNT(DISTINCT l.id) FILTER (WHERE COALESCE(l.is_required, true)) AS total_required_lessons,
  COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed AND COALESCE(l.is_required, true)) AS completed_required_lessons,
  (COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed AND COALESCE(l.is_required, true))
   >=
   NULLIF(COUNT(DISTINCT l.id) FILTER (WHERE COALESCE(l.is_required, true)), 0)) AS is_course_completed,
  MAX(lp.updated_at) AS last_activity_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
LEFT JOIN lessons l ON l.course_id = e.course_id
LEFT JOIN lesson_progress lp
  ON lp.user_id = e.user_id
  AND lp.lesson_id = l.id
GROUP BY e.user_id, e.course_id, c.title;

GRANT SELECT ON course_completion_status TO authenticated;

-- ============================================================
-- 6. CREATE RPC FUNCTIONS
-- ============================================================

-- update_enrollment_progress_manual: called by lesson complete API
CREATE OR REPLACE FUNCTION update_enrollment_progress_manual(
  p_user_id UUID,
  p_course_id UUID,
  p_progress INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE training_enrollments
  SET progress = p_progress,
      status = CASE WHEN p_progress >= 100 THEN 'completed' ELSE status END,
      completed_at = CASE WHEN p_progress >= 100 AND completed_at IS NULL THEN NOW() ELSE completed_at END,
      updated_at = NOW()
  WHERE user_id = p_user_id AND course_id_uuid = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- calculate_course_progress: utility function
CREATE OR REPLACE FUNCTION calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lessons FROM lessons WHERE course_id = p_course_id;
  IF total_lessons = 0 THEN RETURN 0; END IF;
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress
  WHERE user_id = p_user_id AND course_id = p_course_id AND completed = true;
  RETURN ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- generate_certificate_number: utility function
CREATE OR REPLACE FUNCTION generate_certificate_number() RETURNS TEXT AS $$
BEGIN
  RETURN 'EFH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. GRANT PERMISSIONS
-- ============================================================

GRANT SELECT ON enrollments TO authenticated;
GRANT SELECT ON courses TO authenticated;
GRANT SELECT ON lessons TO authenticated;
GRANT SELECT ON course_completion_status TO authenticated;
GRANT SELECT ON enrollments TO anon;
GRANT SELECT ON courses TO anon;
GRANT SELECT ON lessons TO anon;

-- ============================================================
-- 8. ENSURE handle_new_user TRIGGER CAPTURES full_name
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_default_tenant uuid;
  v_full_name text;
BEGIN
  -- Get the default tenant
  SELECT id INTO v_default_tenant
  FROM public.tenants
  WHERE active = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- Extract full_name from user metadata
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    TRIM(COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')),
    NULL
  );
  IF v_full_name = '' THEN v_full_name := NULL; END IF;

  INSERT INTO public.profiles (id, email, role, tenant_id, full_name)
  VALUES (NEW.id, NEW.email, 'student', v_default_tenant, v_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    tenant_id = COALESCE(profiles.tenant_id, EXCLUDED.tenant_id);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
