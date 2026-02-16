-- Create LMS Courses - Part 4: Certifications (CPR, OSHA 10, Rise Up, CPRS, CPRC, CCHW)
-- Elevate for Humanity Learning Management System

-- ============================================
-- 1. CPR CERTIFICATION (STANDALONE)
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'cpr-certification',
  'CPR Certification',
  'Life-saving skills in one day',
  'Get CPR/AED certified in one day through American Heart Association or Red Cross training.',
  'beginner',
  4,
  'published',
  true,
  jsonb_build_object(
    'provider', 'American Heart Association / Red Cross',
    'funding', ARRAY['WIOA', 'WRG'],
    'format', 'In-Person Hands-On Training',
    'credentials', ARRAY['CPR/AED Certification (2-year validity)'],
    'live_instruction_placeholder', true,
    'hands_on_placeholder', true
  )
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

WITH course_ref AS (SELECT id FROM courses WHERE slug = 'cpr-certification')
INSERT INTO modules (course_id, title, description, order_index, is_published)
SELECT course_ref.id, module_data.title, module_data.description, module_data.order_index, true
FROM course_ref,
(VALUES
  (1, 'Adult CPR & AED', 'Hands-on practice with adult CPR and automated external defibrillator'),
  (2, 'Child & Infant CPR', 'Pediatric CPR techniques and special considerations'),
  (3, 'Choking Relief', 'Heimlich maneuver and airway obstruction relief'),
  (4, 'Certification Assessment', 'Skills demonstration and written exam'),
  (5, 'HANDS-ON TRAINING', 'In-person manikin practice and skills assessment')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 2. OSHA 10 CERTIFICATION
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'osha-10-certification',
  'OSHA 10 Certification',
  'Essential workplace safety training',
  'OSHA 10-Hour General Industry certification provides foundational knowledge of workplace safety and health hazards.',
  'beginner',
  10,
  'published',
  true,
  jsonb_build_object(
    'provider', 'OSHA Authorized Training Provider',
    'funding', ARRAY['WIOA', 'WRG'],
    'format', 'Online or In-Person',
    'credentials', ARRAY['OSHA 10-Hour Card'],
    'live_instruction_placeholder', true,
    'hands_on_placeholder', false
  )
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

WITH course_ref AS (SELECT id FROM courses WHERE slug = 'osha-10-certification')
INSERT INTO modules (course_id, title, description, order_index, is_published)
SELECT course_ref.id, module_data.title, module_data.description, module_data.order_index, true
FROM course_ref,
(VALUES
  (1, 'Introduction to OSHA', 'OSHA standards, worker rights, employer responsibilities'),
  (2, 'Hazard Recognition', 'Identifying workplace hazards and risk assessment'),
  (3, 'Fall Protection', 'Fall hazards, prevention, and protective equipment'),
  (4, 'Electrical Safety', 'Electrical hazards, lockout/tagout, safe work practices'),
  (5, 'Personal Protective Equipment (PPE)', 'Types of PPE, proper use, and maintenance'),
  (6, 'Emergency Response', 'Emergency action plans, evacuation, and first aid'),
  (7, 'Final Assessment', 'Comprehensive exam for OSHA 10 certification'),
  (8, 'LIVE INSTRUCTION SESSIONS', 'Optional instructor-led sessions for clarification')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 3. RISE UP CERTIFICATE
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'rise-up-certificate',
  'Rise Up Certificate',
  'Foundational skills for career success',
  'Build foundational skills for career success and personal growth. Nationally recognized workforce readiness credential.',
  'beginner',
  40,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Rise Up / Elevate for Humanity',
    'funding', ARRAY['WIOA', 'JRI'],
    'format', 'Flexible Online',
    'credentials', ARRAY['Rise Up Credential (Nationally Recognized)'],
    'live_instruction_placeholder', true,
    'hands_on_placeholder', false
  )
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

WITH course_ref AS (SELECT id FROM courses WHERE slug = 'rise-up-certificate')
INSERT INTO modules (course_id, title, description, order_index, is_published)
SELECT course_ref.id, module_data.title, module_data.description, module_data.order_index, true
FROM course_ref,
(VALUES
  (1, 'Digital Literacy', 'Computer basics, email, internet navigation, online safety'),
  (2, 'Professional Communication', 'Email etiquette, phone skills, workplace communication'),
  (3, 'Workplace Readiness', 'Punctuality, teamwork, problem-solving, work ethic'),
  (4, 'Financial Literacy', 'Budgeting, banking, credit, financial goal setting'),
  (5, 'Personal Wellness', 'Stress management, self-care, goal setting, resilience'),
  (6, 'Career Exploration', 'Resume basics, job search, interview preparation'),
  (7, 'Final Assessment', 'Rise Up credential assessment and certification'),
  (8, 'LIVE COACHING SESSIONS', 'Optional career coaching and support sessions')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 4. CERTIFIED PEER SUPPORT PROFESSIONAL
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'certified-peer-support-professional',
  'Certified Peer Support Professional',
  'Support others through lived experience',
  'Become a certified peer support professional and help others in recovery. Recognized by behavioral health agencies.',
  'beginner',
  75,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG'],
    'format', 'Hybrid - Online and In-Person',
    'credentials', ARRAY['Certified Peer Support Professional'],
    'live_instruction_placeholder', true,
    'hands_on_placeholder', true
  )
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

WITH course_ref AS (SELECT id FROM courses WHERE slug = 'certified-peer-support-professional')
INSERT INTO modules (course_id, title, description, order_index, is_published)
SELECT course_ref.id, module_data.title, module_data.description, module_data.order_index, true
FROM course_ref,
(VALUES
  (1, 'Foundations of Peer Support', 'Role, ethics, boundaries, lived experience'),
  (2, 'Recovery Principles', 'Recovery models, hope, empowerment, self-determination'),
  (3, 'Trauma-Informed Care', 'Understanding trauma, safety, trust, collaboration'),
  (4, 'Communication Skills', 'Active listening, empathy, motivational interviewing'),
  (5, 'Advocacy & Resource Connection', 'Systems navigation, community resources, self-advocacy'),
  (6, 'Crisis Support', 'Crisis intervention, suicide prevention, de-escalation'),
  (7, 'Professional Development', 'Self-care, supervision, continuing education'),
  (8, 'Certification Exam Prep', 'Final assessment and certification'),
  (9, 'LIVE INSTRUCTION SESSIONS', 'Weekly instructor-led training'),
  (10, 'PRACTICUM EXPERIENCE', 'Supervised peer support practice')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 5. CERTIFIED PEER RECOVERY COACH (CPRC)
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'certified-peer-recovery-coach',
  'Certified Peer Recovery Coach (CPRC)',
  'Guide others on their recovery journey',
  'Earn your CPRC credential and make a difference in recovery services. Nationally recognized certification.',
  'beginner',
  80,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG'],
    'format', 'Hybrid - Online and In-Person',
    'credentials', ARRAY['Certified Peer Recovery Coach (CPRC)'],
    'live_instruction_placeholder', true,
    'hands_on_placeholder', true
  )
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

WITH course_ref AS (SELECT id FROM courses WHERE slug = 'certified-peer-recovery-coach')
INSERT INTO modules (course_id, title, description, order_index, is_published)
SELECT course_ref.id, module_data.title, module_data.description, module_data.order_index, true
FROM course_ref,
(VALUES
  (1, 'Recovery Coaching Foundations', 'Role of recovery coach, ethics, professional boundaries'),
  (2, 'Motivational Interviewing', 'MI principles, OARS, change talk, ambivalence'),
  (3, 'Recovery Capital', 'Social, physical, human, cultural capital assessment'),
  (4, 'Relapse Prevention', 'Triggers, coping strategies, recovery planning'),
  (5, 'Co-Occurring Disorders', 'Mental health, substance use, integrated treatment'),
  (6, 'Family & Community Support', 'Family dynamics, community resources, support systems'),
  (7, 'Ethical Practice', 'Confidentiality, dual relationships, professional conduct'),
  (8, 'CPRC Certification Exam', 'Final assessment and national certification'),
  (9, 'LIVE INSTRUCTION SESSIONS', 'Weekly training with certified recovery coaches'),
  (10, 'SUPERVISED PRACTICUM', 'Real-world recovery coaching experience')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 6. CERTIFIED COMMUNITY HEALTHCARE WORKER (CCHW)
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'certified-community-healthcare-worker',
  'Certified Community Healthcare Worker (CCHW)',
  'Bridge healthcare gaps in your community',
  'Become a certified community healthcare worker and improve health outcomes. No prior healthcare experience required.',
  'beginner',
  100,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG'],
    'format', 'Hybrid - Online and In-Person',
    'credentials', ARRAY['Certified Community Healthcare Worker (CCHW)'],
    'live_instruction_placeholder', true,
    'hands_on_placeholder', true
  )
) ON CONFLICT (slug) DO UPDATE SET updated_at = NOW();

WITH course_ref AS (SELECT id FROM courses WHERE slug = 'certified-community-healthcare-worker')
INSERT INTO modules (course_id, title, description, order_index, is_published)
SELECT course_ref.id, module_data.title, module_data.description, module_data.order_index, true
FROM course_ref,
(VALUES
  (1, 'Introduction to Community Health', 'CHW role, public health basics, social determinants of health'),
  (2, 'Patient Navigation', 'Healthcare system navigation, appointment scheduling, insurance'),
  (3, 'Health Education & Outreach', 'Health literacy, chronic disease management, prevention'),
  (4, 'Cultural Competency', 'Diversity, equity, inclusion, cultural humility'),
  (5, 'Resource Connection', 'Community resources, referrals, case management basics'),
  (6, 'Communication & Advocacy', 'Patient advocacy, motivational interviewing, conflict resolution'),
  (7, 'Documentation & Ethics', 'HIPAA, confidentiality, record-keeping, professional boundaries'),
  (8, 'CCHW Certification Exam', 'Final assessment and certification'),
  (9, 'LIVE INSTRUCTION SESSIONS', 'Weekly training with experienced CHWs'),
  (10, 'FIELD PRACTICUM', 'Supervised community health work experience')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Part 4 Complete: Created 6 certification courses';
  RAISE NOTICE '📚 Courses: CPR, OSHA 10, Rise Up, CPSP, CPRC, CCHW';
  RAISE NOTICE '🎓 Total courses created: 15';
  RAISE NOTICE '🎉 ALL LMS COURSES COMPLETE!';
END $$;
