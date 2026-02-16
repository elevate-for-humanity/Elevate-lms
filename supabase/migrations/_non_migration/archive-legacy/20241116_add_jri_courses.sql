-- Add Job Ready Indy (JRI) Courses to LMS
-- Elevate for Humanity is an approved JRI Facilitator through EmployIndy
-- These courses are embedded from EmployIndy's Learning Hub

-- ============================================
-- JRI BADGE COURSE 1: PROFESSIONALISM & RELIABILITY
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'jri-professionalism-reliability',
  'JRI Badge 1: Professionalism & Reliability',
  'Job Ready Indy workforce readiness credential',
  'Develop professional workplace behaviors including punctuality, attendance, appropriate dress, and reliable work habits. This EmployIndy Job Ready Indy badge course is embedded directly in your Elevate for Humanity training.',
  'beginner',
  8,
  'published',
  true,
  jsonb_build_object(
    'provider', 'EmployIndy',
    'funding', ARRAY['WIOA', 'JRI'],
    'jri_badge', 1,
    'jri_badge_name', 'Professionalism & Reliability',
    'external_course', true,
    'external_url', 'https://jri.employindy.org',
    'registration_url', 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['JRI Badge 1 - Professionalism & Reliability'],
    'part_of_jri_series', true,
    'jri_facilitator', 'Elevate for Humanity Career and Training Institute'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- JRI BADGE COURSE 2: TEAMWORK & COMMUNICATION
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'jri-teamwork-communication',
  'JRI Badge 2: Teamwork & Communication',
  'Job Ready Indy workforce readiness credential',
  'Master effective communication, active listening, and collaborative teamwork skills essential for workplace success. This EmployIndy Job Ready Indy badge course is embedded directly in your Elevate for Humanity training.',
  'beginner',
  8,
  'published',
  true,
  jsonb_build_object(
    'provider', 'EmployIndy',
    'funding', ARRAY['WIOA', 'JRI'],
    'jri_badge', 2,
    'jri_badge_name', 'Teamwork & Communication',
    'external_course', true,
    'external_url', 'https://jri.employindy.org',
    'registration_url', 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['JRI Badge 2 - Teamwork & Communication'],
    'part_of_jri_series', true,
    'jri_facilitator', 'Elevate for Humanity Career and Training Institute'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- JRI BADGE COURSE 3: PROBLEM SOLVING
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'jri-problem-solving',
  'JRI Badge 3: Problem Solving',
  'Job Ready Indy workforce readiness credential',
  'Develop critical thinking and problem-solving skills to address workplace challenges effectively. This EmployIndy Job Ready Indy badge course is embedded directly in your Elevate for Humanity training.',
  'beginner',
  8,
  'published',
  true,
  jsonb_build_object(
    'provider', 'EmployIndy',
    'funding', ARRAY['WIOA', 'JRI'],
    'jri_badge', 3,
    'jri_badge_name', 'Problem Solving',
    'external_course', true,
    'external_url', 'https://jri.employindy.org',
    'registration_url', 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['JRI Badge 3 - Problem Solving'],
    'part_of_jri_series', true,
    'jri_facilitator', 'Elevate for Humanity Career and Training Institute'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- JRI BADGE COURSE 4: DIGITAL SKILLS
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'jri-digital-skills',
  'JRI Badge 4: Digital Skills',
  'Job Ready Indy workforce readiness credential',
  'Build essential digital literacy skills including email, internet navigation, online safety, and workplace technology. This EmployIndy Job Ready Indy badge course is embedded directly in your Elevate for Humanity training.',
  'beginner',
  8,
  'published',
  true,
  jsonb_build_object(
    'provider', 'EmployIndy',
    'funding', ARRAY['WIOA', 'JRI'],
    'jri_badge', 4,
    'jri_badge_name', 'Digital Skills',
    'external_course', true,
    'external_url', 'https://jri.employindy.org',
    'registration_url', 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['JRI Badge 4 - Digital Skills'],
    'part_of_jri_series', true,
    'jri_facilitator', 'Elevate for Humanity Career and Training Institute'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- JRI BADGE COURSE 5: WORK ETHIC & RESPONSIBILITY
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'jri-work-ethic-responsibility',
  'JRI Badge 5: Work Ethic & Responsibility',
  'Job Ready Indy workforce readiness credential',
  'Demonstrate strong work ethic, personal responsibility, and accountability in the workplace. This EmployIndy Job Ready Indy badge course is embedded directly in your Elevate for Humanity training.',
  'beginner',
  8,
  'published',
  true,
  jsonb_build_object(
    'provider', 'EmployIndy',
    'funding', ARRAY['WIOA', 'JRI'],
    'jri_badge', 5,
    'jri_badge_name', 'Work Ethic & Responsibility',
    'external_course', true,
    'external_url', 'https://jri.employindy.org',
    'registration_url', 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['JRI Badge 5 - Work Ethic & Responsibility'],
    'part_of_jri_series', true,
    'jri_facilitator', 'Elevate for Humanity Career and Training Institute'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- JRI BADGE COURSE 6: CAREER READINESS
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'jri-career-readiness',
  'JRI Badge 6: Career Readiness',
  'Job Ready Indy workforce readiness credential',
  'Prepare for career success with resume building, interview skills, job search strategies, and professional development. This EmployIndy Job Ready Indy badge course is embedded directly in your Elevate for Humanity training.',
  'beginner',
  8,
  'published',
  true,
  jsonb_build_object(
    'provider', 'EmployIndy',
    'funding', ARRAY['WIOA', 'JRI'],
    'jri_badge', 6,
    'jri_badge_name', 'Career Readiness',
    'external_course', true,
    'external_url', 'https://jri.employindy.org',
    'registration_url', 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['JRI Badge 6 - Career Readiness'],
    'part_of_jri_series', true,
    'jri_facilitator', 'Elevate for Humanity Career and Training Institute'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- JRI COMPLETE SERIES (All 6 Badges)
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'jri-complete-series',
  'Job Ready Indy (JRI) Complete Series',
  'Earn all 6 JRI badges and workforce readiness credential',
  'Complete all six Job Ready Indy badge courses to earn your JRI workforce readiness credential. This nationally recognized credential demonstrates your soft skills and workplace readiness to employers. Facilitated by Elevate for Humanity Career and Training Institute, an approved EmployIndy JRI Facilitator.',
  'beginner',
  48,
  'published',
  true,
  jsonb_build_object(
    'provider', 'EmployIndy',
    'funding', ARRAY['WIOA', 'JRI'],
    'jri_complete_series', true,
    'external_course', true,
    'external_url', 'https://jri.employindy.org',
    'registration_url', 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
    'format', '100% Online - Self-paced',
    'total_badges', 6,
    'credentials', ARRAY['Job Ready Indy (JRI) Credential', 'All 6 JRI Badges'],
    'jri_facilitator', 'Elevate for Humanity Career and Training Institute',
    'facilitator_contact', 'Elizabeth Greene',
    'dashboard_access', 'Course Progress dashboard available'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Add modules for JRI Complete Series (links to individual badges)
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'jri-complete-series'
)
INSERT INTO modules (course_id, title, description, order_index, is_published)
SELECT 
  course_ref.id,
  module_data.title,
  module_data.description,
  module_data.order_index,
  true
FROM course_ref,
(VALUES
  (1, 'Getting Started with JRI', 'Register and access your JRI courses through EmployIndy Learning Hub'),
  (2, 'Badge 1: Professionalism & Reliability', 'Complete Badge 1 course at jri.employindy.org'),
  (3, 'Badge 2: Teamwork & Communication', 'Complete Badge 2 course at jri.employindy.org'),
  (4, 'Badge 3: Problem Solving', 'Complete Badge 3 course at jri.employindy.org'),
  (5, 'Badge 4: Digital Skills', 'Complete Badge 4 course at jri.employindy.org'),
  (6, 'Badge 5: Work Ethic & Responsibility', 'Complete Badge 5 course at jri.employindy.org'),
  (7, 'Badge 6: Career Readiness', 'Complete Badge 6 course at jri.employindy.org'),
  (8, 'Earn Your JRI Credential', 'Complete all 6 badges to receive your Job Ready Indy credential')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added 7 Job Ready Indy (JRI) courses to LMS';
  RAISE NOTICE '📚 6 individual badge courses + 1 complete series';
  RAISE NOTICE '🎓 Facilitated by Elevate for Humanity (approved JRI Facilitator)';
  RAISE NOTICE '🔗 Registration: https://learning.employindy.org/jri-participant-elevatehumanitycareertraining';
  RAISE NOTICE '🌐 JRI Portal: https://jri.employindy.org';
END $$;
