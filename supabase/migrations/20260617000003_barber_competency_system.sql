-- Barber competency system
--
-- 1. lesson_competencies — links course_lessons to competencies (replaces
--    curriculum_lesson_competencies which uses generation_lesson_id, not course_lesson_id)
-- 2. student_competency_progress — tracks per-student competency mastery
-- 3. Seed competencies for the barber program from blueprint definitions
-- 4. Seed lesson_competencies from domainKey → competency mapping
--
-- Canonical barber course: 3fb5ce19-1cde-434c-a8c6-f138d7d7aa17
-- Canonical barber program slug: barber-apprenticeship

-- ── Table: lesson_competencies ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_competencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  competency_id   uuid NOT NULL REFERENCES public.competencies(id)   ON DELETE CASCADE,
  is_primary      boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_competencies_lesson_id
  ON public.lesson_competencies(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_competencies_competency_id
  ON public.lesson_competencies(competency_id);

-- ── Table: student_competency_progress ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_competency_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  competency_id   uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  program_id      uuid,
  touchpoints     int  NOT NULL DEFAULT 0,   -- lessons completed that touch this competency
  is_mastered     boolean NOT NULL DEFAULT false,
  mastered_at     timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_student_competency_progress_user
  ON public.student_competency_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_competency_progress_competency
  ON public.student_competency_progress(competency_id);

-- ── Seed: competencies for barber program ────────────────────────────────────
-- Keyed by competency_key (unique within program). Idempotent via ON CONFLICT DO NOTHING.

DO $$
DECLARE
  barber_program_id uuid;
BEGIN
  -- Resolve program UUID from slug
  SELECT id INTO barber_program_id
  FROM public.programs
  WHERE slug = 'barber-apprenticeship'
  LIMIT 1;

  IF barber_program_id IS NULL THEN
    RAISE NOTICE 'barber-apprenticeship program not found — skipping competency seed';
    RETURN;
  END IF;

  -- Add competency_key column if not present (competencies table is generic)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'competencies' AND column_name = 'competency_key'
  ) THEN
    ALTER TABLE public.competencies ADD COLUMN competency_key text;
    ALTER TABLE public.competencies ADD COLUMN is_critical boolean NOT NULL DEFAULT false;
    ALTER TABLE public.competencies ADD COLUMN minimum_touchpoints int NOT NULL DEFAULT 1;
    ALTER TABLE public.competencies ADD COLUMN domain_key text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_competencies_program_key
      ON public.competencies(program_id, competency_key)
      WHERE competency_key IS NOT NULL;
  END IF;

  -- Module 1: Infection Control & Safety
  INSERT INTO public.competencies (program_id, competency_key, name, is_critical, minimum_touchpoints, domain_key)
  VALUES
    (barber_program_id, 'sanitation_standards',   'Sanitation Standards',         true,  2, 'infection_control'),
    (barber_program_id, 'disinfection_protocols', 'Disinfection Protocols',       true,  2, 'infection_control'),
    (barber_program_id, 'osha_compliance',        'OSHA Compliance',              true,  1, 'infection_control'),
    (barber_program_id, 'bloodborne_pathogens',   'Bloodborne Pathogen Control',  true,  1, 'infection_control'),
  -- Module 2: Hair Science & Scalp Analysis
    (barber_program_id, 'hair_structure',         'Hair & Scalp Structure',       true,  2, 'hair_science'),
    (barber_program_id, 'hair_growth_cycle',      'Hair Growth Cycle',            true,  1, 'hair_science'),
    (barber_program_id, 'scalp_conditions',       'Scalp Conditions & Disorders', true,  2, 'hair_science'),
    (barber_program_id, 'hair_texture',           'Hair Texture & Porosity',      false, 1, 'hair_science'),
  -- Module 3: Tools, Equipment & Ergonomics
    (barber_program_id, 'clipper_operation',      'Clipper Operation',            true,  2, 'tools_equipment'),
    (barber_program_id, 'scissor_technique',      'Scissor Technique',            true,  2, 'tools_equipment'),
    (barber_program_id, 'razor_safety',           'Razor Safety',                 true,  2, 'tools_equipment'),
    (barber_program_id, 'tool_maintenance',       'Tool Maintenance',             false, 1, 'tools_equipment'),
  -- Module 4: Haircutting Techniques
    (barber_program_id, 'fade_technique',         'Fade Technique',               true,  3, 'haircutting'),
    (barber_program_id, 'clipper_over_comb',      'Clipper Over Comb',            true,  2, 'haircutting'),
    (barber_program_id, 'scissor_over_comb',      'Scissor Over Comb',            true,  2, 'haircutting'),
    (barber_program_id, 'lineup_edging',          'Lineup & Edging',              true,  2, 'haircutting'),
    (barber_program_id, 'head_shape_analysis',    'Head Shape Analysis',          false, 1, 'haircutting'),
  -- Module 5: Shaving & Beard Services
    (barber_program_id, 'shave_preparation',      'Shave Preparation',            true,  2, 'shaving'),
    (barber_program_id, 'razor_technique',        'Straight Razor Technique',     true,  3, 'shaving'),
    (barber_program_id, 'beard_design',           'Beard Design & Shaping',       true,  2, 'shaving'),
    (barber_program_id, 'skin_care',              'Post-Shave Skin Care',         false, 1, 'shaving'),
  -- Module 6: Chemical Services
    (barber_program_id, 'hair_color_theory',      'Hair Color Theory',            true,  2, 'chemical_services'),
    (barber_program_id, 'relaxer_services',       'Relaxer & Texturizer Services',true,  2, 'chemical_services'),
    (barber_program_id, 'chemical_safety',        'Chemical Service Safety',      true,  2, 'chemical_services'),
  -- Module 7: Professional & Business Skills
    (barber_program_id, 'client_retention',       'Client Retention',             true,  2, 'professional_skills'),
    (barber_program_id, 'shop_management',        'Shop & Business Management',   true,  2, 'professional_skills'),
    (barber_program_id, 'professional_image',     'Professional Image & Ethics',  false, 1, 'professional_skills'),
  -- Module 8: State Board Exam Preparation
    (barber_program_id, 'written_exam_prep',      'Written Exam Preparation',     true,  3, 'exam_prep'),
    (barber_program_id, 'practical_exam_prep',    'Practical Exam Preparation',   true,  2, 'exam_prep')
  ON CONFLICT (program_id, competency_key) DO NOTHING;

END $$;

-- ── Seed: lesson_competencies from domainKey mapping ─────────────────────────
-- Each course_lesson is linked to all competencies in its domain.
-- Idempotent via ON CONFLICT DO NOTHING.

INSERT INTO public.lesson_competencies (lesson_id, competency_id, is_primary)
SELECT
  cl.id   AS lesson_id,
  c.id    AS competency_id,
  true    AS is_primary
FROM public.course_lessons cl
JOIN public.competencies   c
  ON c.domain_key  = cl.slug  -- placeholder: will be replaced by domainKey join below
WHERE cl.course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
ON CONFLICT (lesson_id, competency_id) DO NOTHING;

-- The above won't work without domainKey on course_lessons.
-- Add domainKey column and backfill from blueprint slug patterns, then join.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'course_lessons' AND column_name = 'domain_key'
  ) THEN
    ALTER TABLE public.course_lessons ADD COLUMN domain_key text;
  END IF;
END $$;

-- Backfill domain_key on barber course_lessons from slug prefix
UPDATE public.course_lessons
SET domain_key = CASE
  WHEN slug LIKE 'barber-lesson-1'  OR slug LIKE 'barber-lesson-2'  OR slug LIKE 'barber-lesson-3'
    OR slug LIKE 'barber-lesson-4'  OR slug LIKE 'barber-lesson-5'  OR slug LIKE 'barber-lesson-6'
    OR slug LIKE 'barber-module-1%' THEN 'infection_control'
  WHEN slug LIKE 'barber-lesson-8'  OR slug LIKE 'barber-lesson-9'  OR slug LIKE 'barber-lesson-10'
    OR slug LIKE 'barber-lesson-11' OR slug LIKE 'barber-lesson-12' OR slug LIKE 'barber-lesson-13'
    OR slug LIKE 'barber-module-2%' THEN 'hair_science'
  WHEN slug LIKE 'barber-lesson-15' OR slug LIKE 'barber-lesson-16' OR slug LIKE 'barber-lesson-17'
    OR slug LIKE 'barber-lesson-18' OR slug LIKE 'barber-lesson-19' OR slug LIKE 'barber-lesson-20'
    OR slug LIKE 'barber-module-3%' THEN 'tools_equipment'
  WHEN slug LIKE 'barber-lesson-22' OR slug LIKE 'barber-lesson-23' OR slug LIKE 'barber-lesson-24'
    OR slug LIKE 'barber-lesson-25' OR slug LIKE 'barber-lesson-26' OR slug LIKE 'barber-lesson-27'
    OR slug LIKE 'barber-module-4%' THEN 'haircutting'
  WHEN slug LIKE 'barber-lesson-29' OR slug LIKE 'barber-lesson-30' OR slug LIKE 'barber-lesson-31'
    OR slug LIKE 'barber-lesson-32' OR slug LIKE 'barber-lesson-33'
    OR slug LIKE 'barber-module-5%' THEN 'shaving'
  WHEN slug LIKE 'barber-lesson-35' OR slug LIKE 'barber-lesson-36' OR slug LIKE 'barber-lesson-37'
    OR slug LIKE 'barber-lesson-38'
    OR slug LIKE 'barber-module-6%' THEN 'chemical_services'
  WHEN slug LIKE 'barber-lesson-40' OR slug LIKE 'barber-lesson-41' OR slug LIKE 'barber-lesson-42'
    OR slug LIKE 'barber-lesson-43' OR slug LIKE 'barber-lesson-44'
    OR slug LIKE 'barber-module-7%' THEN 'professional_skills'
  WHEN slug LIKE 'barber-lesson-46' OR slug LIKE 'barber-lesson-47' OR slug LIKE 'barber-lesson-48'
    OR slug LIKE 'barber-lesson-49' OR slug LIKE 'barber-indiana%'
    OR slug LIKE 'barber-module-8%' THEN 'exam_prep'
  ELSE NULL
END
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND domain_key IS NULL;

-- Now seed lesson_competencies using the domain_key join
-- (replace the placeholder INSERT above — this is the real one)
DELETE FROM public.lesson_competencies
WHERE lesson_id IN (
  SELECT id FROM public.course_lessons
  WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
);

INSERT INTO public.lesson_competencies (lesson_id, competency_id, is_primary)
SELECT
  cl.id  AS lesson_id,
  c.id   AS competency_id,
  true   AS is_primary
FROM public.course_lessons cl
JOIN public.competencies   c
  ON c.domain_key = cl.domain_key
 AND c.program_id = (
   SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1
 )
WHERE cl.course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND cl.domain_key IS NOT NULL
ON CONFLICT (lesson_id, competency_id) DO NOTHING;

-- ── Verification ─────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM public.competencies
--   WHERE program_id = (SELECT id FROM programs WHERE slug = 'barber-apprenticeship');
-- → must return 29
--
-- SELECT COUNT(*) FROM public.lesson_competencies lc
--   JOIN public.course_lessons cl ON cl.id = lc.lesson_id
--   WHERE cl.course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
-- → must return > 0 (one row per lesson per competency in its domain)
