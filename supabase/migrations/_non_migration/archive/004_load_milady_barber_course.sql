-- ============================================================================
-- LOAD MILADY BARBER APPRENTICESHIP COURSE
-- Populates database with complete 2,000-hour curriculum
-- ============================================================================

-- ============================================================================
-- INSERT PROGRAM
-- ============================================================================

INSERT INTO programs (slug, title, track, blurb, hours, cover_url)
VALUES (
  'barber-apprenticeship',
  'Barber Apprenticeship',
  'Beauty',
  'DOL Registered Apprenticeship - 2,000 hours of comprehensive training leading to Indiana State Barber License',
  '2000 hours',
  '/programs/barber.jpg'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  blurb = EXCLUDED.blurb,
  hours = EXCLUDED.hours;

-- ============================================================================
-- INSERT COURSE
-- ============================================================================

INSERT INTO courses (
  program_id,
  code,
  title,
  summary,
  provider,
  duration_hours,
  format,
  difficulty,
  prerequisites,
  learning_outcomes,
  target_audience,
  certification_name,
  certification_issuer,
  certification_valid_period,
  dol_registered,
  etpl_approved
)
SELECT 
  p.id,
  'BARBER-2000',
  'Milady Barber Apprenticeship Program',
  'Comprehensive 2,000-hour apprenticeship combining classroom instruction with on-the-job training. Master all aspects of barbering from basic cuts to advanced techniques, business management, and professional standards.',
  'Milady',
  2000,
  'Hybrid - On-the-job + Classroom',
  'Beginner',
  ARRAY[]::text[],
  ARRAY[
    'Master fundamental and advanced barbering techniques',
    'Understand infection control and safety protocols',
    'Develop professional client communication skills',
    'Learn business management and entrepreneurship',
    'Prepare for Indiana State Board examination',
    'Build a professional portfolio',
    'Understand state laws and regulations',
    'Develop expertise in men''s grooming and styling'
  ],
  ARRAY[
    'Career changers seeking skilled trade',
    'High school graduates',
    'Veterans transitioning to civilian careers',
    'Individuals interested in beauty industry',
    'Entrepreneurs wanting to own a barbershop'
  ],
  'Indiana State Barber License',
  'Indiana Professional Licensing Agency',
  'Lifetime (with continuing education)',
  true,
  true
FROM programs p
WHERE p.slug = 'barber-apprenticeship'
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  provider = EXCLUDED.provider,
  duration_hours = EXCLUDED.duration_hours,
  format = EXCLUDED.format,
  learning_outcomes = EXCLUDED.learning_outcomes,
  target_audience = EXCLUDED.target_audience,
  certification_name = EXCLUDED.certification_name,
  dol_registered = EXCLUDED.dol_registered,
  etpl_approved = EXCLUDED.etpl_approved;

-- ============================================================================
-- INSERT MODULES
-- ============================================================================

-- Module 1: Professional Foundations
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Professional Foundations',
  'Introduction to barbering profession, history, and professional standards',
  1,
  80
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 2: Infection Control & Safety
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Infection Control & Safety',
  'Comprehensive training in sanitation, sterilization, and safety protocols',
  2,
  100
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 3: Anatomy & Physiology
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Anatomy & Physiology',
  'Understanding skin, hair, and scalp structure and function',
  3,
  120
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 4: Basic Haircutting
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Basic Haircutting',
  'Fundamental cutting techniques and tools',
  4,
  300
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 5: Advanced Haircutting & Styling
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Advanced Haircutting & Styling',
  'Advanced techniques, fades, designs, and contemporary styles',
  5,
  400
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 6: Shaving & Facial Hair
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Shaving & Facial Hair',
  'Traditional and modern shaving techniques, beard grooming',
  6,
  200
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 7: Hair Coloring & Chemical Services
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Hair Coloring & Chemical Services',
  'Color theory, application techniques, and chemical treatments',
  7,
  250
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 8: Scalp & Hair Treatments
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Scalp & Hair Treatments',
  'Therapeutic treatments, product knowledge, and client consultation',
  8,
  150
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 9: Business & Professional Development
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'Business & Professional Development',
  'Shop management, marketing, client relations, and career planning',
  9,
  200
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- Module 10: State Board Preparation
INSERT INTO modules (course_id, title, description, "order", duration_hours)
SELECT 
  c.id,
  'State Board Preparation',
  'Comprehensive review and exam preparation',
  10,
  200
FROM courses c WHERE c.code = 'BARBER-2000'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSERT SAMPLE LESSONS (Module 1)
-- ============================================================================

-- Get module 1 ID
DO $$
DECLARE
  v_course_id uuid;
  v_module_id uuid;
BEGIN
  -- Get course ID
  SELECT id INTO v_course_id FROM courses WHERE code = 'BARBER-2000';
  
  -- Get module 1 ID
  SELECT id INTO v_module_id FROM modules 
  WHERE course_id = v_course_id AND "order" = 1;
  
  -- Insert lessons for Module 1
  INSERT INTO lessons (module_id, course_id, idx, title, duration_minutes, topics, html)
  VALUES
    (
      v_module_id,
      v_course_id,
      1,
      'History of Barbering',
      240,
      ARRAY['Ancient barbering traditions', 'Evolution of the profession', 'Modern barbering industry', 'Professional organizations and standards'],
      '<h2>History of Barbering</h2>
      <p>Barbering is one of the oldest professions in the world, dating back thousands of years. In this lesson, you''ll explore the rich history of barbering from ancient civilizations to modern times.</p>
      <h3>Learning Objectives</h3>
      <ul>
        <li>Understand the origins of barbering in ancient civilizations</li>
        <li>Trace the evolution of barbering through different time periods</li>
        <li>Recognize the role of barbers in society throughout history</li>
        <li>Identify modern professional organizations and standards</li>
      </ul>
      <h3>Ancient Barbering Traditions</h3>
      <p>Barbering has roots in ancient Egypt, Greece, and Rome. Barbers were highly respected members of society who provided grooming services to nobility and common people alike.</p>
      <h3>The Barber-Surgeon Era</h3>
      <p>During the Middle Ages, barbers also performed surgical procedures and dentistry. The iconic barber pole originated from this era, with red representing blood and white representing bandages.</p>
      <h3>Modern Barbering</h3>
      <p>Today''s barbers are skilled professionals who specialize in men''s grooming, combining traditional techniques with contemporary styles and trends.</p>'
    ),
    (
      v_module_id,
      v_course_id,
      2,
      'Professional Image & Ethics',
      480,
      ARRAY['Personal grooming and hygiene', 'Professional conduct and ethics', 'Client communication skills', 'Building a professional reputation'],
      '<h2>Professional Image & Ethics</h2>
      <p>Your professional image and ethical conduct are essential to your success as a barber. This lesson covers the standards and practices that define a professional barber.</p>
      <h3>Personal Grooming Standards</h3>
      <ul>
        <li>Maintain clean, professional appearance</li>
        <li>Practice excellent personal hygiene</li>
        <li>Dress appropriately for the workplace</li>
        <li>Keep hands and nails clean and well-groomed</li>
      </ul>
      <h3>Professional Ethics</h3>
      <p>Ethical conduct includes honesty, integrity, respect for clients, and adherence to professional standards. Always maintain client confidentiality and provide services within your scope of practice.</p>
      <h3>Client Communication</h3>
      <p>Effective communication builds trust and ensures client satisfaction. Learn to listen actively, ask clarifying questions, and provide clear explanations of services.</p>'
    ),
    (
      v_module_id,
      v_course_id,
      3,
      'Shop Management Basics',
      720,
      ARRAY['Barbershop operations', 'Appointment scheduling', 'Inventory management', 'Customer service excellence'],
      '<h2>Shop Management Basics</h2>
      <p>Understanding barbershop operations is crucial whether you work for someone else or plan to own your own shop. This lesson covers the fundamentals of shop management.</p>
      <h3>Daily Operations</h3>
      <ul>
        <li>Opening and closing procedures</li>
        <li>Maintaining a clean and organized workspace</li>
        <li>Managing appointment schedules</li>
        <li>Handling walk-in clients</li>
      </ul>
      <h3>Inventory Management</h3>
      <p>Learn to track supplies, order products, and manage inventory efficiently to ensure you always have what you need without overstocking.</p>
      <h3>Customer Service Excellence</h3>
      <p>Exceptional customer service keeps clients coming back. Learn techniques for greeting clients, managing wait times, handling complaints, and building long-term relationships.</p>'
    ),
    (
      v_module_id,
      v_course_id,
      4,
      'State Laws & Regulations',
      480,
      ARRAY['Indiana State Board requirements', 'Licensing procedures', 'Scope of practice', 'Legal responsibilities'],
      '<h2>State Laws & Regulations</h2>
      <p>As a licensed barber in Indiana, you must understand and comply with state laws and regulations governing the profession.</p>
      <h3>Indiana State Board Requirements</h3>
      <ul>
        <li>2,000 hours of training required</li>
        <li>Pass written and practical examinations</li>
        <li>Maintain continuing education</li>
        <li>Renew license every 2 years</li>
      </ul>
      <h3>Scope of Practice</h3>
      <p>Understand what services you are legally permitted to perform as a licensed barber in Indiana. This includes haircuts, shaves, beard trims, and certain chemical services.</p>
      <h3>Legal Responsibilities</h3>
      <p>Learn about your legal obligations including sanitation requirements, record keeping, and professional liability.</p>'
    )
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- CREATE SAMPLE QUIZ QUESTIONS
-- ============================================================================

DO $$
DECLARE
  v_lesson_id uuid;
BEGIN
  -- Get first lesson ID
  SELECT l.id INTO v_lesson_id
  FROM lessons l
  JOIN courses c ON l.course_id = c.id
  WHERE c.code = 'BARBER-2000' AND l.idx = 1;
  
  -- Insert quiz questions
  INSERT INTO quiz_questions (lesson_id, prompt, options, answer)
  VALUES
    (
      v_lesson_id,
      'What do the colors on a traditional barber pole represent?',
      ARRAY['Red for blood, white for bandages', 'Red for passion, white for purity', 'Red for fire, white for water'],
      'Red for blood, white for bandages'
    ),
    (
      v_lesson_id,
      'In which ancient civilization did barbering originate?',
      ARRAY['Egypt', 'China', 'India', 'All of the above'],
      'All of the above'
    ),
    (
      v_lesson_id,
      'What additional services did barbers provide during the Middle Ages?',
      ARRAY['Cooking', 'Surgery and dentistry', 'Blacksmithing'],
      'Surgery and dentistry'
    )
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify course was created
SELECT 
  'Course created' AS status,
  c.title,
  c.duration_hours,
  c.format,
  c.dol_registered,
  c.etpl_approved
FROM courses c
WHERE c.code = 'BARBER-2000';

-- Verify modules were created
SELECT 
  'Modules created' AS status,
  COUNT(*) AS module_count,
  SUM(duration_hours) AS total_hours
FROM modules m
JOIN courses c ON m.course_id = c.id
WHERE c.code = 'BARBER-2000';

-- Verify lessons were created
SELECT 
  'Lessons created' AS status,
  COUNT(*) AS lesson_count
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.code = 'BARBER-2000';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Milady Barber Apprenticeship course loaded successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Course Details:';
  RAISE NOTICE '- 10 modules';
  RAISE NOTICE '- 2,000 total hours';
  RAISE NOTICE '- 4 sample lessons in Module 1';
  RAISE NOTICE '- Quiz questions included';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Add more lesson content to remaining modules';
  RAISE NOTICE '2. Create lesson pages in frontend';
  RAISE NOTICE '3. Enable student enrollment';
  RAISE NOTICE '4. Test progress tracking';
END $$;
