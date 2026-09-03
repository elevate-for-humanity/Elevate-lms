-- ===== BEGIN 20260528000002_tutorials_table.sql =====
-- Tutorials table for /help/tutorials
-- Replaces hardcoded array in page.tsx

ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tutorials_slug ON public.tutorials(slug) WHERE slug IS NOT NULL;
/*SKIP_CREATE
CREATE TABLE IF NOT EXISTS public.tutorials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text,
  category      text NOT NULL,
  thumbnail_url text,
  video_url     text,
  duration      text,
  is_published  boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read published tutorials
DO $$ BEGIN CREATE POLICY "tutorials_read" ON public.tutorials
  FOR SELECT USING (is_published = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can manage all tutorials
DO $$ BEGIN CREATE POLICY "tutorials_admin" ON public.tutorials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed the 12 existing tutorials from the hardcoded array
INSERT INTO public.tutorials (slug, title, description, category, duration, sort_order) VALUES
  ('getting-started',         'Getting Started with Elevate LMS',       'Learn how to navigate the platform and set up your learner profile.',                                    'Getting Started', '5 min',  1),
  ('enrolling-in-courses',    'Enrolling in Courses',                    'Step-by-step guide to finding and enrolling in your first course.',                                      'Getting Started', '4 min',  2),
  ('completing-lessons',      'Completing Lessons and Tracking Progress','How to work through lessons, mark them complete, and monitor your progress.',                            'Learning',        '6 min',  3),
  ('taking-quizzes',          'Taking Quizzes and Assessments',          'Tips for completing quizzes, understanding your scores, and retaking assessments.',                      'Learning',        '5 min',  4),
  ('downloading-certificates','Downloading Your Certificates',           'How to access and download your completion certificates after finishing a course.',                      'Certificates',    '3 min',  5),
  ('sharing-credentials',     'Sharing Your Credentials',                'Share your certificates and credentials with employers and on LinkedIn.',                                'Certificates',    '4 min',  6),
  ('managing-profile',        'Managing Your Profile',                   'Update your personal information, profile photo, and notification preferences.',                         'Account',         '4 min',  7),
  ('payment-financial-aid',   'Payment and Financial Aid Options',       'Understand your payment options, financial aid eligibility, and how to apply for funding.',              'Account',         '7 min',  8),
  ('mobile-app',              'Using the Mobile App',                    'Access your courses on the go with the Elevate mobile experience.',                                      'Getting Started', '5 min',  9),
  ('live-sessions',           'Joining Live Sessions',                   'How to join live instructor sessions, webinars, and virtual office hours.',                              'Learning',        '6 min', 10),
  ('technical-requirements',  'Technical Requirements',                  'System requirements, browser compatibility, and troubleshooting common technical issues.',               'Support',         '4 min', 11),
  ('contacting-support',      'Contacting Support',                      'How to reach our support team, submit a ticket, and get help when you need it.',                        'Support',         '3 min', 12)
ON CONFLICT (slug) DO NOTHING;
*/

-- ===== END 20260528000002_tutorials_table.sql =====

-- ===== BEGIN 20260529000001_grant_anon_program_tables.sql =====
-- Grant anon read access to program detail tables.
-- These tables had no SELECT grant for the anon role, causing 401s on all
-- public program pages that use createPublicClient().

GRANT SELECT ON public.program_media    TO anon;
GRANT SELECT ON public.program_ctas     TO anon;
GRANT SELECT ON public.program_tracks   TO anon;
GRANT SELECT ON public.program_modules  TO anon;
GRANT SELECT ON public.program_lessons  TO anon;

-- ===== END 20260529000001_grant_anon_program_tables.sql =====

-- ===== BEGIN 20260529000002_lms_lessons_include_curriculum_lessons.sql =====
-- Rebuild lms_lessons view to prioritize curriculum_lessons over course_lessons.
--
-- Key fixes vs previous version:
-- 1. Cast step_type to TEXT (curriculum_lessons uses an enum, course_lessons uses text)
-- 2. Resolve module_id from course_modules via module_order join — curriculum_lessons
--    has a FK to the 'modules' table, not 'course_modules', so we can't store
--    course_modules.id directly. The view resolves it at query time.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE VIEW public.lms_lessons AS

-- ── 1. curriculum_lessons (priority) ─────────────────────────────────────────
SELECT
  cl.id,
  cl.course_id,
  (cl.module_order * 1000 + cl.lesson_order)  AS order_index,
  cl.lesson_order                              AS lesson_number,
  cl.lesson_title                              AS title,
  cl.script_text                               AS content,
  NULL::TEXT                                   AS rendered_html,
  cl.step_type::TEXT                           AS step_type,
  cl.step_type::TEXT                           AS content_type,
  cl.lesson_slug                               AS slug,
  cl.lesson_slug                               AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  NULL::JSONB                                  AS activities,
  NULL::JSONB                                  AS video_config,
  cm.id                                        AS module_id,
  cm.title                                     AS module_title,
  cl.module_order,
  cl.lesson_order,
  cl.duration_minutes,
  (cl.status = 'published')                    AS is_published,
  cl.status,
  'curriculum'::TEXT                           AS lesson_source,
  cl.created_at,
  cl.updated_at,
  NULL::TEXT                                   AS partner_exam_code,
  cl.video_file                                AS video_url,
  NULL::UUID                                   AS quiz_id,
  NULL::TEXT                                   AS description,
  NULL::JSONB                                  AS resources,
  NULL::TEXT                                   AS scorm_package_id,
  NULL::TEXT                                   AS scorm_launch_path
FROM public.curriculum_lessons cl
LEFT JOIN public.course_modules cm
  ON cm.course_id = cl.course_id
  AND cm.order_index = cl.module_order

UNION ALL

-- ── 2. course_lessons fallback (courses not in curriculum_lessons) ────────────
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                               AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                          AS content,
  cl.rendered_html,
  cl.lesson_type::TEXT                         AS step_type,
  cl.lesson_type::TEXT                         AS content_type,
  cl.slug,
  cl.slug                                      AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                                     AS module_title,
  COALESCE(cm.order_index, 0)                  AS module_order,
  NULL::INTEGER                                AS lesson_order,
  NULL::INTEGER                                AS duration_minutes,
  cl.is_published,
  cl.status,
  'canonical'::TEXT                            AS lesson_source,
  cl.created_at,
  cl.updated_at,
  cl.partner_exam_code,
  cl.video_url,
  NULL::UUID                                   AS quiz_id,
  NULL::TEXT                                   AS description,
  NULL::JSONB                                  AS resources,
  NULL::TEXT                                   AS scorm_package_id,
  NULL::TEXT                                   AS scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.curriculum_lessons cur
  WHERE cur.course_id = cl.course_id
);

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ===== END 20260529000002_lms_lessons_include_curriculum_lessons.sql =====

-- ===== BEGIN 20260530000001_seed_hvac_program_relations.sql =====
-- Seed program_media, program_ctas, and program_modules for the HVAC Technician program.
-- program_tracks already has 3 rows — not touched.
--
-- Program ID: 4226f7f6-fbc1-44b5-83e8-b12ea149e4c7
-- Slug: hvac-technician

DO $$
DECLARE
  v_program_id UUID := '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';

  -- module IDs
  m1  UUID; m2  UUID; m3  UUID; m4  UUID; m5  UUID;
  m6  UUID; m7  UUID; m8  UUID; m9  UUID; m10 UUID;
BEGIN

  -- ── 1. program_media ───────────────────────────────────────────────────────
  INSERT INTO public.program_media (program_id, media_type, url, alt_text, sort_order)
  VALUES
    (v_program_id, 'hero_image', '/images/pages/programs-hvac-course-hero.jpg',
     'HVAC technician working on an air conditioning unit', 1)
  ON CONFLICT DO NOTHING;

  -- ── 2. program_ctas ────────────────────────────────────────────────────────
  INSERT INTO public.program_ctas (program_id, cta_type, label, href, style_variant, is_external, sort_order)
  VALUES
    (v_program_id, 'apply',        'Apply Now',          '/programs/hvac-technician/apply', 'primary',   FALSE, 1),
    (v_program_id, 'request_info', 'Check My Eligibility', '/contact?program=hvac-technician', 'secondary', FALSE, 2)
  ON CONFLICT DO NOTHING;

  -- ── 3. program_modules + program_lessons ───────────────────────────────────

  -- Module 1
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 1, 'HVAC Fundamentals', 'Introduction to heating, ventilation, and air conditioning systems. Tools, safety, and industry standards.', 8, 6, 1)
  RETURNING id INTO m1;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m1, 1, 'Introduction to HVAC Systems',          'lesson', 30, 1),
    (m1, 2, 'Tools and Safety Equipment',             'lesson', 25, 2),
    (m1, 3, 'Industry Standards and Codes',           'lesson', 30, 3),
    (m1, 4, 'Heat Transfer Principles',               'lesson', 35, 4),
    (m1, 5, 'Air Distribution Basics',                'lesson', 30, 5),
    (m1, 6, 'Ductwork and Airflow',                   'lesson', 30, 6),
    (m1, 7, 'Ventilation and Indoor Air Quality',     'lesson', 25, 7),
    (m1, 8, 'Module 1 Checkpoint',                   'quiz',   20, 8);

  -- Module 2
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 2, 'Electrical Systems', 'Wiring, circuits, controls, and electrical diagnostics on real HVAC equipment.', 8, 6, 2)
  RETURNING id INTO m2;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m2, 1, 'Electrical Fundamentals for HVAC',       'lesson', 35, 1),
    (m2, 2, 'Reading Wiring Diagrams',                'lesson', 30, 2),
    (m2, 3, 'Motors and Capacitors',                  'lesson', 30, 3),
    (m2, 4, 'Contactors and Relays',                  'lesson', 25, 4),
    (m2, 5, 'Thermostats and Controls',               'lesson', 30, 5),
    (m2, 6, 'Electrical Diagnostics Lab',             'lab',    45, 6),
    (m2, 7, 'Safety and Lockout/Tagout',              'lesson', 20, 7),
    (m2, 8, 'Module 2 Checkpoint',                   'quiz',   20, 8);

  -- Module 3
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 3, 'Refrigeration Cycle', 'Refrigerant handling, pressure-temperature relationships, and EPA 608 core concepts.', 9, 7, 3)
  RETURNING id INTO m3;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m3, 1, 'Refrigeration Cycle Overview',           'lesson', 35, 1),
    (m3, 2, 'Refrigerants and Properties',            'lesson', 30, 2),
    (m3, 3, 'Pressure-Temperature Relationships',     'lesson', 35, 3),
    (m3, 4, 'Compressors',                            'lesson', 30, 4),
    (m3, 5, 'Condensers and Evaporators',             'lesson', 30, 5),
    (m3, 6, 'Metering Devices',                       'lesson', 25, 6),
    (m3, 7, 'Refrigerant Handling Lab',               'lab',    45, 7),
    (m3, 8, 'EPA 608 Core Concepts',                  'lesson', 40, 8),
    (m3, 9, 'Module 3 Checkpoint',                   'quiz',   20, 9);

  -- Module 4
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 4, 'System Installation', 'Installing residential AC units, furnaces, and heat pumps to manufacturer and code specifications.', 8, 7, 4)
  RETURNING id INTO m4;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m4, 1, 'Site Assessment and Planning',           'lesson', 30, 1),
    (m4, 2, 'Residential AC Installation',           'lesson', 40, 2),
    (m4, 3, 'Furnace Installation',                  'lesson', 40, 3),
    (m4, 4, 'Heat Pump Installation',                'lesson', 40, 4),
    (m4, 5, 'Ductwork Installation',                 'lesson', 35, 5),
    (m4, 6, 'Startup and Commissioning',             'lesson', 30, 6),
    (m4, 7, 'Installation Lab',                      'lab',    60, 7),
    (m4, 8, 'Module 4 Checkpoint',                  'quiz',   20, 8);

  -- Module 5
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 5, 'System Repair', 'Diagnosing and repairing common failures in residential and light commercial HVAC systems.', 8, 6, 5)
  RETURNING id INTO m5;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m5, 1, 'Diagnostic Approach and Process',        'lesson', 30, 1),
    (m5, 2, 'Compressor Failures',                   'lesson', 35, 2),
    (m5, 3, 'Refrigerant Leaks and Recharge',        'lesson', 35, 3),
    (m5, 4, 'Electrical Component Replacement',      'lesson', 30, 4),
    (m5, 5, 'Airflow and Duct Repairs',              'lesson', 25, 5),
    (m5, 6, 'Repair Lab',                            'lab',    60, 6),
    (m5, 7, 'Customer Communication',                'lesson', 20, 7),
    (m5, 8, 'Module 5 Checkpoint',                  'quiz',   20, 8);

  -- Module 6
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 6, 'Advanced Diagnostics', 'System performance testing, fault isolation, and advanced troubleshooting techniques.', 7, 6, 6)
  RETURNING id INTO m6;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m6, 1, 'System Performance Testing',            'lesson', 35, 1),
    (m6, 2, 'Fault Isolation Techniques',            'lesson', 35, 2),
    (m6, 3, 'Using Diagnostic Tools',                'lesson', 30, 3),
    (m6, 4, 'Heat Pump Diagnostics',                 'lesson', 35, 4),
    (m6, 5, 'Commercial System Basics',              'lesson', 30, 5),
    (m6, 6, 'Advanced Diagnostics Lab',              'lab',    60, 6),
    (m6, 7, 'Module 6 Checkpoint',                  'quiz',   20, 7);

  -- Module 7
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 7, 'EPA 608 Certification Prep', 'Targeted preparation for EPA 608 Universal certification — Core, Type I, II, and III sections.', 8, 6, 7)
  RETURNING id INTO m7;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m7, 1, 'EPA 608 Exam Overview',                 'lesson', 20, 1),
    (m7, 2, 'Core Section Review',                   'lesson', 40, 2),
    (m7, 3, 'Type I — Small Appliances',             'lesson', 35, 3),
    (m7, 4, 'Type II — High-Pressure Systems',       'lesson', 35, 4),
    (m7, 5, 'Type III — Low-Pressure Systems',       'lesson', 35, 5),
    (m7, 6, 'Universal Practice Exam 1',             'quiz',   45, 6),
    (m7, 7, 'Universal Practice Exam 2',             'quiz',   45, 7),
    (m7, 8, 'EPA 608 Proctored Exam',               'exam',   90, 8);

  -- Module 8
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 8, 'OSHA 10 Safety', 'OSHA 10-hour construction safety certification covering hazard recognition and prevention.', 5, 10, 8)
  RETURNING id INTO m8;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m8, 1, 'Introduction to OSHA',                  'lesson', 60, 1),
    (m8, 2, 'Fall Protection',                       'lesson', 60, 2),
    (m8, 3, 'Electrical Safety',                     'lesson', 60, 3),
    (m8, 4, 'Personal Protective Equipment',         'lesson', 60, 4),
    (m8, 5, 'OSHA 10 Certification Exam',           'exam',   60, 5);

  -- Module 9
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 9, 'CPR / First Aid', 'CPR and First Aid certification required by most HVAC employers for field positions.', 3, 4, 9)
  RETURNING id INTO m9;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m9, 1, 'CPR Fundamentals',                      'lesson', 60, 1),
    (m9, 2, 'First Aid and AED',                     'lesson', 60, 2),
    (m9, 3, 'CPR / First Aid Certification',        'exam',   60, 3);

  -- Module 10
  INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
  VALUES (v_program_id, 10, 'Career Readiness', 'Resume building, job placement support, employer introductions, and program wrap-up.', 5, 4, 10)
  RETURNING id INTO m10;

  INSERT INTO public.program_lessons (module_id, lesson_number, title, lesson_type, duration_minutes, sort_order) VALUES
    (m10, 1, 'Resume and Interview Prep',             'lesson', 45, 1),
    (m10, 2, 'Job Search Strategies',                'lesson', 30, 2),
    (m10, 3, 'Employer Partner Introductions',       'lesson', 30, 3),
    (m10, 4, 'Licensing and Continuing Education',   'lesson', 25, 4),
    (m10, 5, 'Program Completion and Graduation',   'orientation', 30, 5);

  -- ── 4. Update programs row with headline fields ────────────────────────────
  UPDATE public.programs SET
    hero_headline     = 'HVAC Technician Training',
    hero_subheadline  = '12 weeks. EPA 608 Universal. $0 for eligible Indiana residents.',
    length_weeks      = 12,
    certificate_title = 'EPA 608 Universal Certification',
    funding           = 'WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
    outcomes          = 'Graduates are qualified for entry-level HVAC helper and installer roles ($18–$22/hr) with a clear path to licensed technician ($22–$30/hr).',
    requirements      = '"Must be 18 or older. No prior HVAC experience required. Indiana resident preferred for workforce funding eligibility."'::jsonb
  WHERE id = v_program_id;

END $$;

-- ===== END 20260530000001_seed_hvac_program_relations.sql =====

-- ===== BEGIN 20260530000002_fix_lms_lessons_video_url.sql =====
-- Atomic repair for HVAC lesson content pipeline.
--
-- Problem: course_lessons.video_url is NULL for all 95 HVAC lessons.
--          curriculum_lessons.video_file has all 95 Supabase storage URLs.
--          lms_lessons view reads course_lessons.video_url → always NULL.
--
-- Fix:
--   1. Backfill course_lessons.video_url from curriculum_lessons.video_file
--      joined on slug = lesson_slug for the HVAC course.
--   2. Rebuild lms_lessons view to COALESCE(cl.video_url, cur.video_file)
--      so future courses with video_url set directly also work.

-- ── 1. Backfill course_lessons.video_url ─────────────────────────────────────

UPDATE public.course_lessons cl
SET    video_url = cur.video_file
FROM   public.curriculum_lessons cur
WHERE  cl.slug      = cur.lesson_slug
AND    cl.course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
AND    cur.video_file IS NOT NULL
AND    (cl.video_url IS NULL OR cl.video_url = '');

-- ── 2. Rebuild lms_lessons view ───────────────────────────────────────────────
-- Keeps all existing columns. Adds COALESCE for video_url so curriculum
-- video_file is used when course_lessons.video_url is empty.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.lesson_number,
  cl.title,
  cl.content,
  cl.rendered_html,
  -- Pull video from curriculum_lessons if course_lessons.video_url is empty
  COALESCE(NULLIF(cl.video_url, ''), cur.video_file) AS video_url,
  COALESCE(cl.step_type, cl.content_type)            AS step_type,
  cl.content_type,
  cl.slug,
  cur.lesson_slug,
  COALESCE(cl.passing_score, cur.passing_score)      AS passing_score,
  COALESCE(cl.quiz_questions, cur.quiz_questions)    AS quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cl.module_title,
  cl.module_order,
  cl.lesson_order,
  cl.duration_minutes,
  cl.is_published,
  cl.status,
  'curriculum'::text                                 AS lesson_source,
  cl.created_at,
  cl.updated_at,
  cl.partner_exam_code,
  cl.quiz_id,
  cl.description,
  cl.resources,
  cl.scorm_package_id,
  cl.scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.curriculum_lessons cur
  ON  cur.lesson_slug = cl.slug
  AND cur.course_id   = cl.course_id

UNION ALL

SELECT
  tl.id,
  tl.course_id,
  tl.order_index,
  tl.lesson_number,
  tl.title,
  tl.content,
  NULL::text                                         AS rendered_html,
  tl.video_url,
  COALESCE(tl.lesson_type, 'lesson')                AS step_type,
  tl.content_type,
  NULL::text                                         AS slug,
  NULL::text                                         AS lesson_slug,
  tl.passing_score,
  tl.quiz_questions,
  NULL::jsonb                                        AS activities,
  NULL::jsonb                                        AS video_config,
  tl.module_id,
  NULL::text                                         AS module_title,
  NULL::integer                                      AS module_order,
  tl.order_index                                     AS lesson_order,
  tl.duration_minutes,
  tl.is_published,
  NULL::text                                         AS status,
  'training'::text                                   AS lesson_source,
  tl.created_at,
  tl.updated_at,
  NULL::text                                         AS partner_exam_code,
  tl.quiz_id,
  tl.description,
  NULL::jsonb                                        AS resources,
  NULL::text                                         AS scorm_package_id,
  NULL::text                                         AS scorm_launch_path
FROM public.training_lessons tl
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_lessons cl2
  WHERE cl2.course_id = tl.course_id
);

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ===== END 20260530000002_fix_lms_lessons_video_url.sql =====

-- ===== BEGIN 20260531000001_program_builder_columns.sql =====
-- Migration: program_builder_columns
-- Adds phase_id to program_modules (multi-phase curriculum support)
-- Adds is_published to program_lessons (per-lesson publish state)
-- Adds program_phases table as the grouping layer

-- ── 1. program_phases ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_phases (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_phases_program_id
  ON public.program_phases(program_id, sort_order);

ALTER TABLE public.program_phases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "phases_read" ON public.program_phases
  FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "phases_admin_all" ON public.program_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. phase_id on program_modules ───────────────────────────────────────────

ALTER TABLE public.program_modules
  ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.program_phases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_program_modules_phase_id
  ON public.program_modules(phase_id);

-- ── 3. is_published on program_lessons ───────────────────────────────────────

ALTER TABLE public.program_lessons
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_program_lessons_published
  ON public.program_lessons(module_id, is_published);

-- ── 4. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT ON public.program_phases TO authenticated;
GRANT ALL    ON public.program_phases TO service_role;

-- ===== END 20260531000001_program_builder_columns.sql =====

