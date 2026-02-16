-- Create LMS Courses - Part 2: Beauty & Career Educator, Esthetician, Tax Prep
-- Elevate for Humanity Learning Management System

-- ============================================
-- 1. BEAUTY & CAREER EDUCATOR TRAINING PROGRAM
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'beauty-career-educator',
  'Beauty & Career Educator Training Program',
  'Develop career-ready, technical, and leadership skills in beauty education',
  'The Beauty & Career Educator Training Program is a 12-week hybrid training experience designed to help aspiring beauty professionals and peer educators develop career-ready, technical, and leadership skills. This program includes practical salon service education (manicuring techniques, customer service, sanitation), instructional tools for peer teaching and community workshops, and a strong focus on entrepreneurship and workforce readiness.',
  'beginner',
  144,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG'],
    'cip_code', '13.1319 - Technical Teacher Education',
    'soc_codes', ARRAY['25-1194 Career/Technical Education Teachers', '39-5092 Manicurists and Pedicurists'],
    'weeks', 12,
    'days', 84,
    'hours_per_week', 12,
    'total_hours', 144,
    'online_available_percent', 40,
    'instructor_led_percent', 50,
    'lab_field_percent', 40,
    'self_study_percent', 10,
    'format', 'Hybrid - 50% Instructor-Led, 40% Lab/Field, 10% Self-Study (40% available online)',
    'schedule', ARRAY['Day', 'Evening', 'Weekend', 'Online'],
    'credentials', ARRAY['Rise Up Credential', 'CPR Certification', 'OSHA 10 Certification', 'Certificate of Completion'],
    'prerequisites', 'None',
    'admission_rate', 100,
    'career_counseling', true,
    'job_placement', true,
    'placement_assistance', true,
    'part_time_allowed', true,
    'general_public', true,
    'industry_collaboration', false,
    'live_instruction_placeholder', true,
    'hands_on_placeholder', true,
    'location', '8888 Keystone Crossing, Indianapolis, IN 46240'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Modules for Beauty & Career Educator
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'beauty-career-educator'
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
  (1, 'Week 1-2: Foundations of Beauty Education', 'Introduction to teaching methods, adult learning principles, and career pathways in beauty education'),
  (2, 'Week 3-4: Manicuring Techniques & Salon Services', 'Practical nail care, manicuring techniques, customer service, and sanitation protocols'),
  (3, 'Week 5-6: Safety & Compliance', 'OSHA 10 training, workplace safety, infection control, and health regulations'),
  (4, 'Week 7-8: CPR & Emergency Response', 'CPR/AED certification, first aid, and emergency procedures for salon environments'),
  (5, 'Week 9-10: Peer Teaching & Community Workshops', 'Instructional tools, curriculum design, and facilitating community-based workshops'),
  (6, 'Week 11: Entrepreneurship & Workforce Readiness', 'Business planning, digital branding, independent contracting, and salon ownership'),
  (7, 'Week 12: Rise Up Credential & Final Project', 'Career readiness assessment, portfolio development, and certification completion'),
  (8, 'LIVE INSTRUCTION SESSIONS', 'Scheduled live virtual and in-person instruction sessions (50% of program)'),
  (9, 'HANDS-ON LAB TRAINING', 'Practical salon service training at Elevate for Humanity Training Center (40% of program)')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 2. PROFESSIONAL ESTHETICIAN & CLIENT SERVICES
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'professional-esthetician',
  'Professional Esthetician & Client Services Career Program',
  'Job-ready skincare and spa skills',
  'Master skincare, facial treatments, and client services in 5 weeks. This comprehensive non-licensure training blends hands-on instruction with theory-based modules.',
  'beginner',
  60,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG', 'Apprenticeship'],
    'cip_code', '12.0409 - Aesthetician/Esthetician and Skin Care Specialist',
    'apprenticeship_type', 'DOL Federally Registered Apprenticeship',
    'apprenticeship_classification', 'Hybrid (Time-based and Competency-based)',
    'rti_provider_type', 'Other',
    'instruction_weeks', 4,
    'instruction_method', 'In-person, Online, E-learning or Distance Learning',
    'active_apprentices', 3,
    'active_apprentices_date', '2025-06-06',
    'weeks', 5,
    'total_hours', 60,
    'hours_per_week', 15,
    'online_available_percent', 60,
    'instructor_led_percent', 30,
    'lab_field_percent', 10,
    'self_study_percent', 60,
    'format', 'DOL Registered Apprenticeship - Hybrid (30% Instructor-Led, 10% Lab/Field, 60% Self-Study)',
    'schedule', ARRAY['Day', 'Evening', 'Weekend', 'Online'],
    'credentials', ARRAY['OSHA 10 - Career Safe', 'Customer Service and Sales Certified Specialist', 'Business of Retail Certified Specialist', 'Certificate of Completion'],
    'prerequisites', 'None',
    'admission_rate', 60,
    'career_counseling', true,
    'job_placement', true,
    'placement_assistance', true,
    'part_time_allowed', true,
    'general_public', true,
    'industry_collaboration', true,
    'dol_registered', true,
    'etpl_approved', true,
    'rapids_verified', true,
    'live_instruction_placeholder', true,
    'hands_on_placeholder', true,
    'location', '8888 Keystone Crossing, Indianapolis, IN 46240'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Modules for Esthetician
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'professional-esthetician'
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
  (1, 'Week 1: Skin Analysis & Anatomy', 'Understanding skin types, conditions, and facial anatomy'),
  (2, 'Week 2: Facial Treatments & Techniques', 'Cleansing, exfoliation, extractions, and massage'),
  (3, 'Week 3: Hair Removal & Makeup', 'Waxing, tweezing, brow shaping, and makeup application'),
  (4, 'Week 4: Sanitation & Client Services', 'Infection control, safety protocols, and professional communication'),
  (5, 'Week 5: Business & Career Readiness', 'Spa operations, retail sales, and career pathways'),
  (6, 'LIVE INSTRUCTION SESSIONS', 'Scheduled instructor-led training sessions'),
  (7, 'HANDS-ON LAB TRAINING', 'Practical skincare treatments at training facility')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 3. TAX PREPARATION & FINANCIAL SERVICES
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'tax-prep-financial-services',
  'Tax Preparation & Financial Services Certificate',
  'IRS VITA/TCE certification and bookkeeping skills',
  'Earn IRS VITA/TCE certification and launch a career in tax preparation and bookkeeping. 10-week State Certified Earn and Learn program with supervised practicum.',
  'beginner',
  150,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity / IRS VITA/TCE',
    'funding', ARRAY['WIOA', 'WRG', 'Earn and Learn'],
    'cip_code', '52.0302 - Accounting Technology/Technician and Bookkeeping',
    'earn_and_learn_type', 'State Certified Earn and Learn',
    'earn_and_learn_certification_date', '2025-10-01',
    'instruction_method', 'In-person, Online, E-learning or Distance Learning',
    'instruction_weeks', 10,
    'weeks', 10,
    'total_hours', 150,
    'hours_per_week', 15,
    'format', 'State Certified Earn and Learn - 50% Online, 50% Instructor-Led, 25% Lab Work',
    'credentials', ARRAY['Certificate of Completion', 'QuickBooks Pro Advisor', 'Microsoft 365 Fundamentals', 'Rise Up Credential', 'IRS VITA/TCE Certification'],
    'state_certified', true,
    'live_instruction_placeholder', true,
    'hands_on_placeholder', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Modules for Tax Prep
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'tax-prep-financial-services'
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
  (1, 'Week 1-2: Tax Law Fundamentals', 'Federal and state tax basics, filing status, dependents'),
  (2, 'Week 3-4: Income & Deductions', 'W-2, 1099, Schedule C, itemized vs standard deductions'),
  (3, 'Week 5-6: Credits & Special Situations', 'EITC, Child Tax Credit, education credits, retirement'),
  (4, 'Week 7-8: Tax Software & E-Filing', 'IRS Link & Learn, TaxSlayer, electronic filing procedures'),
  (5, 'Week 9: Ethics & Client Intake', 'Professional standards, due diligence, client communication'),
  (6, 'Week 10: VITA Practicum & Certification', 'Supervised tax preparation at IRS-approved VITA site'),
  (7, 'LIVE INSTRUCTION SESSIONS', 'Weekly instructor-led tax law and software training'),
  (8, 'HANDS-ON PRACTICUM', 'Real-world tax preparation at VITA site')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Part 2 Complete: Created 3 more LMS courses';
  RAISE NOTICE '📚 Courses: Beauty & Career Educator, Esthetician, Tax Prep';
  RAISE NOTICE '🎓 Total courses created: 6';
END $$;
