-- Map barber apprenticeship lab lessons to their required apprentice_skills.
-- These are the 10 highest-impact hands-on lessons in the barber program.
-- required_reps and requires_verification enforce the OJT loop.
--
-- Skill IDs reference public.apprentice_skills seeded in 20260527000002.
-- Run after 20260602000001 (adds the columns).

DO $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE slug = 'barber-apprenticeship'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'barber-apprenticeship course not found — skipping skill mapping';
    RETURN;
  END IF;

  -- Sanitation and Safety → Disinfection procedure (WPS Area 5)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%disinfect%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 3,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'sanitation-and-safety';

  -- Basic Haircut Techniques → Basic haircut (WPS Area 1)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%basic haircut%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 5,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'basic-haircut-techniques';

  -- Fade and Taper Techniques → Fade cut (WPS Area 1)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%fade%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 5,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'fade-and-taper-techniques';

  -- Beard and Mustache Grooming → Beard trim (WPS Area 2)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%beard%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 3,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'beard-and-mustache-grooming';

  -- Shaving Techniques → Straight razor shave (WPS Area 2)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%razor%' OR name ILIKE '%shave%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 3,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'shaving-techniques';

  -- Client Consultation → Client consultation (WPS Area 6)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%consultation%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 5,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'client-consultation';

  -- Advanced Cutting Techniques → Advanced cut (WPS Area 1)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%advanced%cut%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 5,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'advanced-cutting-techniques';

  -- Razor Cutting → Razor cutting (WPS Area 1)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%razor cut%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 3,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'razor-cutting';

  -- Hair Coloring Basics → Color application (WPS Area 3)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%color%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 3,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'hair-coloring-basics';

  -- Scalp Treatments → Scalp treatment (WPS Area 4)
  UPDATE public.course_lessons SET
    lesson_type          = 'lab',
    required_skill_id    = (SELECT id FROM public.apprentice_skills WHERE name ILIKE '%scalp%' AND program_id = (SELECT id FROM public.programs WHERE slug = 'barber-apprenticeship' LIMIT 1) LIMIT 1),
    required_reps        = 3,
    requires_verification = TRUE
  WHERE course_id = v_course_id AND slug = 'scalp-treatments';

  RAISE NOTICE 'Barber lab lesson skill mapping complete';
END $$;
