-- ═══════════════════════════════════════════════════════════
-- Admin Platform Expansion Migration
-- Adds: curriculum tables, media_jobs, partner_verifications,
--        partner_programs, and links courses to programs.
-- ═══════════════════════════════════════════════════════════

-- 1. Add program_id to courses if missing (only if courses is a base table, not a view)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'courses' AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'program_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN program_id uuid REFERENCES programs(id);
    CREATE INDEX idx_courses_program_id ON courses(program_id);
  END IF;
END $$;

-- 2. Curriculum lessons table (the core content table)
CREATE TABLE IF NOT EXISTS curriculum_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id),
  course_id uuid REFERENCES courses(id),
  module_id uuid REFERENCES modules(id),
  lesson_slug text NOT NULL,
  lesson_title text NOT NULL,
  lesson_order integer NOT NULL DEFAULT 0,
  module_order integer NOT NULL DEFAULT 0,
  module_title text,
  script_text text,
  key_terms jsonb DEFAULT '[]'::jsonb,
  job_application text,
  watch_for jsonb DEFAULT '[]'::jsonb,
  diagram_ref text,
  video_file text,
  audio_file text,
  caption_file text,
  diagram_file text,
  duration_minutes integer,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_id, lesson_slug)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_program ON curriculum_lessons(program_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_module ON curriculum_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_order ON curriculum_lessons(program_id, module_order, lesson_order);

-- 3. Curriculum quizzes (linked to lessons)
CREATE TABLE IF NOT EXISTS curriculum_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES curriculum_lessons(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer integer NOT NULL DEFAULT 0,
  explanation text,
  quiz_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_quizzes_lesson ON curriculum_quizzes(lesson_id);

-- 4. Curriculum recaps (linked to lessons)
CREATE TABLE IF NOT EXISTS curriculum_recaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES curriculum_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  recap_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Media jobs table (generation pipeline tracking)
CREATE TABLE IF NOT EXISTS media_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES curriculum_lessons(id),
  program_id uuid REFERENCES programs(id),
  job_type text NOT NULL CHECK (job_type IN ('audio', 'video', 'captions', 'diagram', 'composite')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  input_data jsonb DEFAULT '{}'::jsonb,
  output_path text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_media_jobs_status ON media_jobs(status);
CREATE INDEX IF NOT EXISTS idx_media_jobs_lesson ON media_jobs(lesson_id);

-- 6. Partner verifications
CREATE TABLE IF NOT EXISTS partner_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner_applications(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_by uuid REFERENCES profiles(id),
  notes text,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_partner_verifications_partner ON partner_verifications(partner_id);

-- 7. Partner-program mapping (many-to-many)
CREATE TABLE IF NOT EXISTS partner_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner_applications(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES programs(id),
  approved_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_programs_partner ON partner_programs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_programs_program ON partner_programs(program_id);

-- 8. Add program_code to programs if missing (for URL-friendly lookups)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'code'
  ) THEN
    ALTER TABLE programs ADD COLUMN code text UNIQUE;
  END IF;
END $$;

-- 9. Seed program codes for existing programs
UPDATE programs SET code = 'HVAC' WHERE slug ILIKE '%hvac%' AND code IS NULL;
UPDATE programs SET code = 'CNA' WHERE slug ILIKE '%cna%' AND code IS NULL;
UPDATE programs SET code = 'BARBER' WHERE slug ILIKE '%barber-apprenticeship%' AND code IS NULL;
UPDATE programs SET code = 'CDL' WHERE slug ILIKE '%cdl%' AND code IS NULL;
UPDATE programs SET code = 'ELECTRICAL' WHERE slug ILIKE '%electrical%' AND code IS NULL;
UPDATE programs SET code = 'PLUMBING' WHERE slug ILIKE '%plumbing%' AND code IS NULL;
UPDATE programs SET code = 'WELDING' WHERE slug ILIKE '%welding%' AND code IS NULL;
UPDATE programs SET code = 'PHLEBOTOMY' WHERE slug ILIKE '%phlebotomy%' AND code IS NULL;

-- 10. Enable RLS on new tables
ALTER TABLE curriculum_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_programs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (admin operations)
DROP POLICY IF EXISTS "service_role_all" ON curriculum_lessons;
CREATE POLICY "service_role_all" ON curriculum_lessons FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all" ON curriculum_quizzes;
CREATE POLICY "service_role_all" ON curriculum_quizzes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all" ON curriculum_recaps;
CREATE POLICY "service_role_all" ON curriculum_recaps FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all" ON media_jobs;
CREATE POLICY "service_role_all" ON media_jobs FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all" ON partner_verifications;
CREATE POLICY "service_role_all" ON partner_verifications FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_role_all" ON partner_programs;
CREATE POLICY "service_role_all" ON partner_programs FOR ALL USING (true) WITH CHECK (true);

-- Authenticated users can read curriculum
DROP POLICY IF EXISTS "authenticated_read" ON curriculum_lessons;
CREATE POLICY "authenticated_read" ON curriculum_lessons FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_read" ON curriculum_quizzes;
CREATE POLICY "authenticated_read" ON curriculum_quizzes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_read" ON curriculum_recaps;
CREATE POLICY "authenticated_read" ON curriculum_recaps FOR SELECT TO authenticated USING (true);
