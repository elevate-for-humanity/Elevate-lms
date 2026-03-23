-- CRS (Certified Recovery Specialist) program, modules, and curriculum_lessons seed.
--
-- Credential authority: Indiana DMHA via INARR (info@inarr.org).
-- Training provider approval pending (Selfish Inc. / Elevate for Humanity).
--
-- Blueprint source: lib/curriculum/blueprints/crs-indiana.ts
--   8 modules, 40 lessons, passing threshold 70% (module) / 80% (final exam).
--
-- Apply manually via Supabase Dashboard SQL Editor.
--
-- Verification queries (run after applying):
--   SELECT slug, title, order_index FROM modules
--   WHERE program_id = (SELECT id FROM programs WHERE slug = 'certified-recovery-specialist')
--   ORDER BY order_index;
--   -- Expected: 8 rows
--
--   SELECT COUNT(*) FROM curriculum_lessons
--   WHERE program_id = (SELECT id FROM programs WHERE slug = 'certified-recovery-specialist');
--   -- Expected: 40 rows
--
-- ⚠️  This migration is idempotent. Re-running is safe.

BEGIN;

-- ─── 1. Seed CRS program row ──────────────────────────────────────────────────

INSERT INTO public.programs (
  code,
  title,
  slug,
  description,
  duration_weeks,
  total_hours,
  tuition,
  total_cost,
  funding_eligible,
  status,
  category,
  published,
  is_active
)
VALUES (
  'CRS-IN-2026',
  'Certified Recovery Specialist',
  'certified-recovery-specialist',
  'Indiana DMHA-aligned Certified Recovery Specialist (CRS) training. Covers recovery support fundamentals, advocacy, mentoring, ethics, trauma-informed practice, and workforce readiness. Eligible for WIOA, Workforce Ready Grant, and DOL-registered apprenticeship funding. Delivered at low or no cost to eligible participants through Elevate for Humanity in partnership with Selfish Inc.',
  8,
  40,
  0.00,
  0.00,
  true,
  'active',
  'Recovery Support',
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title            = EXCLUDED.title,
  description      = EXCLUDED.description,
  duration_weeks   = EXCLUDED.duration_weeks,
  total_hours      = EXCLUDED.total_hours,
  funding_eligible = EXCLUDED.funding_eligible,
  status           = EXCLUDED.status,
  category         = EXCLUDED.category,
  published        = EXCLUDED.published,
  is_active        = EXCLUDED.is_active,
  updated_at       = now();

-- ─── 2. Seed 8 CRS modules ────────────────────────────────────────────────────

DO $$
DECLARE
  v_program_id uuid;
BEGIN
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = 'certified-recovery-specialist'
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'CRS program not found after insert. Check programs table.';
  END IF;

  INSERT INTO public.modules (program_id, slug, title, summary, order_index)
  VALUES
    (v_program_id, 'crs-mod-1', 'Recovery Support Fundamentals',
     'Define the CRS role, recovery models, recovery capital, and professional boundaries.',
     1),
    (v_program_id, 'crs-mod-2', 'Advocacy and Systems Navigation',
     'Build client self-advocacy capacity, navigate Indiana community resources, and reduce system barriers.',
     2),
    (v_program_id, 'crs-mod-3', 'Mentoring and Peer Relationships',
     'Practice trust-building, self-disclosure, communication, and motivational support skills.',
     3),
    (v_program_id, 'crs-mod-4', 'Education and Recovery Learning',
     'Teach wellness planning, relapse prevention tools, goal setting, and recovery capital concepts.',
     4),
    (v_program_id, 'crs-mod-5', 'Recovery and Wellness Support',
     'Apply stages of change, wellness dimensions, crisis referral, and long-term recovery maintenance.',
     5),
    (v_program_id, 'crs-mod-6', 'Ethics and Professional Responsibility',
     'Apply the CRS code of ethics, HIPAA/42 CFR Part 2, dual relationship rules, and documentation standards.',
     6),
    (v_program_id, 'crs-mod-7', 'Cultural Responsiveness and Trauma-Informed Practice',
     'Practice cultural humility, equity, trauma-informed principles, and diverse recovery pathway support.',
     7),
    (v_program_id, 'crs-mod-8', 'Professional Growth, Self-Care, and Workforce Readiness',
     'Develop self-care habits, reflective practice, teamwork skills, and CRS exam readiness.',
     8)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title       = EXCLUDED.title,
    summary     = EXCLUDED.summary,
    order_index = EXCLUDED.order_index,
    updated_at  = now();

  RAISE NOTICE 'CRS modules seeded for program_id = %', v_program_id;
END $$;

-- ─── 3. Seed 40 CRS curriculum_lessons ───────────────────────────────────────

DO $$
DECLARE
  v_program_id uuid;
  v_mod_1      uuid;
  v_mod_2      uuid;
  v_mod_3      uuid;
  v_mod_4      uuid;
  v_mod_5      uuid;
  v_mod_6      uuid;
  v_mod_7      uuid;
  v_mod_8      uuid;
BEGIN
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = 'certified-recovery-specialist'
  LIMIT 1;

  SELECT id INTO v_mod_1 FROM public.modules WHERE program_id = v_program_id AND slug = 'crs-mod-1';
  SELECT id INTO v_mod_2 FROM public.modules WHERE program_id = v_program_id AND slug = 'crs-mod-2';
  SELECT id INTO v_mod_3 FROM public.modules WHERE program_id = v_program_id AND slug = 'crs-mod-3';
  SELECT id INTO v_mod_4 FROM public.modules WHERE program_id = v_program_id AND slug = 'crs-mod-4';
  SELECT id INTO v_mod_5 FROM public.modules WHERE program_id = v_program_id AND slug = 'crs-mod-5';
  SELECT id INTO v_mod_6 FROM public.modules WHERE program_id = v_program_id AND slug = 'crs-mod-6';
  SELECT id INTO v_mod_7 FROM public.modules WHERE program_id = v_program_id AND slug = 'crs-mod-7';
  SELECT id INTO v_mod_8 FROM public.modules WHERE program_id = v_program_id AND slug = 'crs-mod-8';

  -- ── Module 1: Recovery Support Fundamentals (5 lessons) ──────────────────
  INSERT INTO public.curriculum_lessons
    (program_id, module_id, slug, title, step_type, module_order, lesson_order, status, passing_score)
  VALUES
    (v_program_id, v_mod_1, 'crs-role-of-certified-recovery-specialist',     'The Role of a Certified Recovery Specialist',     'lesson',     0, 1, 'published', NULL),
    (v_program_id, v_mod_1, 'crs-definitions-and-models-of-recovery',         'Definitions and Models of Recovery',               'lesson',     0, 2, 'published', NULL),
    (v_program_id, v_mod_1, 'crs-recovery-capital-building-on-strengths',     'Recovery Capital: Building on Strengths',          'lesson',     0, 3, 'published', NULL),
    (v_program_id, v_mod_1, 'crs-person-centered-and-self-directed-support',  'Person-Centered and Self-Directed Support',        'lesson',     0, 4, 'published', NULL),
    (v_program_id, v_mod_1, 'crs-professional-boundaries-in-recovery-work',   'Professional Boundaries in Recovery Work',         'checkpoint', 0, 5, 'published', 70)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title         = EXCLUDED.title,
    step_type     = EXCLUDED.step_type,
    module_id     = EXCLUDED.module_id,
    module_order  = EXCLUDED.module_order,
    lesson_order  = EXCLUDED.lesson_order,
    status        = EXCLUDED.status,
    passing_score = EXCLUDED.passing_score,
    updated_at    = now();

  -- ── Module 2: Advocacy and Systems Navigation (5 lessons) ────────────────
  INSERT INTO public.curriculum_lessons
    (program_id, module_id, slug, title, step_type, module_order, lesson_order, status, passing_score)
  VALUES
    (v_program_id, v_mod_2, 'crs-advocacy-in-recovery-systems',              'Advocacy in Recovery Systems',              'lesson',     1, 1, 'published', NULL),
    (v_program_id, v_mod_2, 'crs-navigating-indiana-community-resources',    'Navigating Indiana Community Resources',    'lesson',     1, 2, 'published', NULL),
    (v_program_id, v_mod_2, 'crs-supporting-access-to-treatment-services',   'Supporting Access to Treatment and Services', 'lesson',   1, 3, 'published', NULL),
    (v_program_id, v_mod_2, 'crs-empowerment-and-informed-choice',           'Empowerment and Informed Choice',           'lesson',     1, 4, 'published', NULL),
    (v_program_id, v_mod_2, 'crs-reducing-barriers-and-system-friction',     'Reducing Barriers and System Friction',     'checkpoint', 1, 5, 'published', 70)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title         = EXCLUDED.title,
    step_type     = EXCLUDED.step_type,
    module_id     = EXCLUDED.module_id,
    module_order  = EXCLUDED.module_order,
    lesson_order  = EXCLUDED.lesson_order,
    status        = EXCLUDED.status,
    passing_score = EXCLUDED.passing_score,
    updated_at    = now();

  -- ── Module 3: Mentoring and Peer Relationships (5 lessons) ───────────────
  INSERT INTO public.curriculum_lessons
    (program_id, module_id, slug, title, step_type, module_order, lesson_order, status, passing_score)
  VALUES
    (v_program_id, v_mod_3, 'crs-building-trust-in-recovery-relationships',  'Building Trust in Recovery Relationships',  'lesson',     2, 1, 'published', NULL),
    (v_program_id, v_mod_3, 'crs-using-self-disclosure-appropriately',       'Using Self-Disclosure Appropriately',       'lesson',     2, 2, 'published', NULL),
    (v_program_id, v_mod_3, 'crs-communication-skills-for-recovery-support', 'Communication Skills for Recovery Support', 'lesson',     2, 3, 'published', NULL),
    (v_program_id, v_mod_3, 'crs-motivational-support-and-encouragement',    'Motivational Support and Encouragement',    'lesson',     2, 4, 'published', NULL),
    (v_program_id, v_mod_3, 'crs-maintaining-mutuality-and-respect',         'Maintaining Mutuality and Respect',         'checkpoint', 2, 5, 'published', 70)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title         = EXCLUDED.title,
    step_type     = EXCLUDED.step_type,
    module_id     = EXCLUDED.module_id,
    module_order  = EXCLUDED.module_order,
    lesson_order  = EXCLUDED.lesson_order,
    status        = EXCLUDED.status,
    passing_score = EXCLUDED.passing_score,
    updated_at    = now();

  -- ── Module 4: Education and Recovery Learning (5 lessons) ────────────────
  INSERT INTO public.curriculum_lessons
    (program_id, module_id, slug, title, step_type, module_order, lesson_order, status, passing_score)
  VALUES
    (v_program_id, v_mod_4, 'crs-recovery-education-and-wellness-planning',  'Recovery Education and Wellness Planning',  'lesson',     3, 1, 'published', NULL),
    (v_program_id, v_mod_4, 'crs-teaching-self-advocacy-skills',             'Teaching Self-Advocacy Skills',             'lesson',     3, 2, 'published', NULL),
    (v_program_id, v_mod_4, 'crs-sharing-tools-for-relapse-prevention',      'Sharing Tools for Relapse Prevention',      'lesson',     3, 3, 'published', NULL),
    (v_program_id, v_mod_4, 'crs-supporting-goal-setting-and-action-steps',  'Supporting Goal Setting and Action Steps',  'lesson',     3, 4, 'published', NULL),
    (v_program_id, v_mod_4, 'crs-introducing-recovery-capital-concepts',     'Introducing Recovery Capital Concepts',     'checkpoint', 3, 5, 'published', 70)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title         = EXCLUDED.title,
    step_type     = EXCLUDED.step_type,
    module_id     = EXCLUDED.module_id,
    module_order  = EXCLUDED.module_order,
    lesson_order  = EXCLUDED.lesson_order,
    status        = EXCLUDED.status,
    passing_score = EXCLUDED.passing_score,
    updated_at    = now();

  -- ── Module 5: Recovery and Wellness Support (5 lessons) ──────────────────
  INSERT INTO public.curriculum_lessons
    (program_id, module_id, slug, title, step_type, module_order, lesson_order, status, passing_score)
  VALUES
    (v_program_id, v_mod_5, 'crs-stages-of-change-and-recovery-readiness',    'Stages of Change and Recovery Readiness',    'lesson',     4, 1, 'published', NULL),
    (v_program_id, v_mod_5, 'crs-wellness-dimensions-in-recovery-support',    'Wellness Dimensions in Recovery Support',    'lesson',     4, 2, 'published', NULL),
    (v_program_id, v_mod_5, 'crs-supporting-crisis-awareness-and-referral',   'Supporting Crisis Awareness and Referral',   'lesson',     4, 3, 'published', NULL),
    (v_program_id, v_mod_5, 'crs-community-integration-and-natural-supports', 'Community Integration and Natural Supports', 'lesson',     4, 4, 'published', NULL),
    (v_program_id, v_mod_5, 'crs-supporting-long-term-recovery-maintenance',  'Supporting Long-Term Recovery Maintenance',  'checkpoint', 4, 5, 'published', 70)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title         = EXCLUDED.title,
    step_type     = EXCLUDED.step_type,
    module_id     = EXCLUDED.module_id,
    module_order  = EXCLUDED.module_order,
    lesson_order  = EXCLUDED.lesson_order,
    status        = EXCLUDED.status,
    passing_score = EXCLUDED.passing_score,
    updated_at    = now();

  -- ── Module 6: Ethics and Professional Responsibility (5 lessons) ──────────
  INSERT INTO public.curriculum_lessons
    (program_id, module_id, slug, title, step_type, module_order, lesson_order, status, passing_score)
  VALUES
    (v_program_id, v_mod_6, 'crs-ethical-standards-in-recovery-support',              'Ethical Standards in Recovery Support',              'lesson',     5, 1, 'published', NULL),
    (v_program_id, v_mod_6, 'crs-confidentiality-and-privacy-hipaa-42cfr',            'Confidentiality and Privacy (HIPAA/42 CFR Part 2)',   'lesson',     5, 2, 'published', NULL),
    (v_program_id, v_mod_6, 'crs-boundaries-and-dual-relationships',                  'Boundaries and Dual Relationships',                  'lesson',     5, 3, 'published', NULL),
    (v_program_id, v_mod_6, 'crs-scope-of-role-and-appropriate-referral',             'Scope of Role and Appropriate Referral',             'lesson',     5, 4, 'published', NULL),
    (v_program_id, v_mod_6, 'crs-documentation-professionalism-and-accountability',   'Documentation, Professionalism, and Accountability', 'checkpoint', 5, 5, 'published', 70)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title         = EXCLUDED.title,
    step_type     = EXCLUDED.step_type,
    module_id     = EXCLUDED.module_id,
    module_order  = EXCLUDED.module_order,
    lesson_order  = EXCLUDED.lesson_order,
    status        = EXCLUDED.status,
    passing_score = EXCLUDED.passing_score,
    updated_at    = now();

  -- ── Module 7: Cultural Responsiveness and Trauma-Informed Practice (5 lessons)
  INSERT INTO public.curriculum_lessons
    (program_id, module_id, slug, title, step_type, module_order, lesson_order, status, passing_score)
  VALUES
    (v_program_id, v_mod_7, 'crs-cultural-humility-in-recovery-support',             'Cultural Humility in Recovery Support',             'lesson',     6, 1, 'published', NULL),
    (v_program_id, v_mod_7, 'crs-equity-access-and-inclusive-practice',              'Equity, Access, and Inclusive Practice',            'lesson',     6, 2, 'published', NULL),
    (v_program_id, v_mod_7, 'crs-trauma-informed-principles-for-recovery-work',      'Trauma-Informed Principles for Recovery Work',      'lesson',     6, 3, 'published', NULL),
    (v_program_id, v_mod_7, 'crs-avoiding-retraumatization-in-support-settings',     'Avoiding Retraumatization in Support Settings',     'lesson',     6, 4, 'published', NULL),
    (v_program_id, v_mod_7, 'crs-supporting-diverse-recovery-pathways',              'Supporting Diverse Recovery Pathways',              'checkpoint', 6, 5, 'published', 70)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title         = EXCLUDED.title,
    step_type     = EXCLUDED.step_type,
    module_id     = EXCLUDED.module_id,
    module_order  = EXCLUDED.module_order,
    lesson_order  = EXCLUDED.lesson_order,
    status        = EXCLUDED.status,
    passing_score = EXCLUDED.passing_score,
    updated_at    = now();

  -- ── Module 8: Professional Growth, Self-Care, and Workforce Readiness (5 lessons)
  INSERT INTO public.curriculum_lessons
    (program_id, module_id, slug, title, step_type, module_order, lesson_order, status, passing_score)
  VALUES
    (v_program_id, v_mod_8, 'crs-self-care-and-burnout-prevention',               'Self-Care and Burnout Prevention',               'lesson',     7, 1, 'published', NULL),
    (v_program_id, v_mod_8, 'crs-reflective-practice-and-continuous-improvement', 'Reflective Practice and Continuous Improvement', 'lesson',     7, 2, 'published', NULL),
    (v_program_id, v_mod_8, 'crs-teamwork-and-collaboration-in-service-settings', 'Teamwork and Collaboration in Service Settings', 'lesson',     7, 3, 'published', NULL),
    (v_program_id, v_mod_8, 'crs-career-pathways-for-certified-recovery-specialists', 'Career Pathways for Certified Recovery Specialists', 'lesson', 7, 4, 'published', NULL),
    (v_program_id, v_mod_8, 'crs-exam-preparation-and-certification-process',     'CRS Exam Preparation and Certification Process', 'exam',       7, 5, 'published', 80)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title         = EXCLUDED.title,
    step_type     = EXCLUDED.step_type,
    module_id     = EXCLUDED.module_id,
    module_order  = EXCLUDED.module_order,
    lesson_order  = EXCLUDED.lesson_order,
    status        = EXCLUDED.status,
    passing_score = EXCLUDED.passing_score,
    updated_at    = now();

  RAISE NOTICE 'CRS curriculum_lessons seeded: 40 lessons across 8 modules for program_id = %', v_program_id;
END $$;

-- ─── 4. Verification ──────────────────────────────────────────────────────────

DO $$
DECLARE
  v_program_id  uuid;
  v_mod_count   integer;
  v_lesson_count integer;
  v_checkpoint_count integer;
BEGIN
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = 'certified-recovery-specialist'
  LIMIT 1;

  SELECT COUNT(*) INTO v_mod_count
  FROM public.modules
  WHERE program_id = v_program_id;

  SELECT COUNT(*) INTO v_lesson_count
  FROM public.curriculum_lessons
  WHERE program_id = v_program_id;

  SELECT COUNT(*) INTO v_checkpoint_count
  FROM public.curriculum_lessons
  WHERE program_id = v_program_id AND step_type IN ('checkpoint', 'exam');

  RAISE NOTICE 'CRS seed verification: program_id=%, modules=%, lessons=%, checkpoints/exams=%',
    v_program_id, v_mod_count, v_lesson_count, v_checkpoint_count;

  IF v_mod_count != 8 THEN
    RAISE WARNING 'Expected 8 modules, got %', v_mod_count;
  END IF;

  IF v_lesson_count != 40 THEN
    RAISE WARNING 'Expected 40 lessons, got %', v_lesson_count;
  END IF;
END $$;

COMMIT;
