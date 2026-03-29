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
    requirements      = 'Must be 18 or older. No prior HVAC experience required. Indiana resident preferred for workforce funding eligibility.'
  WHERE id = v_program_id;

END $$;
