-- Create LMS Courses - Part 1: Business Startup, CPR/Health Safety, DSP
-- Elevate for Humanity Learning Management System

-- ============================================
-- 1. BUSINESS START-UP & MARKETING PROGRAM
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours, 
  status, is_free, metadata
) VALUES (
  'business-startup-marketing',
  'Business Start-Up & Marketing Program',
  'Launch your own business with Rise Forward',
  'Learn entrepreneurship, digital marketing, LLC formation, and business planning with mentorship and startup support.',
  'beginner',
  32,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Rise Forward / Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG'],
    'cip_code', '52.0701 - Entrepreneurship/Entrepreneurial Studies',
    'weeks', 5,
    'total_hours', 32,
    'hours_per_week', 8,
    'online_available_percent', 100,
    'instructor_led_percent', 25,
    'lab_field_percent', 0,
    'self_study_percent', 75,
    'format', '100% Online - 25% Instructor-Led, 75% Self-Study',
    'schedule', ARRAY['Day', 'Evening', 'Weekend', 'Online'],
    'credentials', ARRAY['Certificate of Completion', 'Retail Industry Fundamentals Specialist', 'Business of Retail Certified Specialist'],
    'prerequisites', 'None',
    'admission_rate', 100,
    'career_counseling', true,
    'job_placement', true,
    'placement_assistance', true,
    'part_time_allowed', true,
    'general_public', true,
    'industry_collaboration', true,
    'live_instruction_placeholder', true,
    'hands_on_placeholder', false,
    'location', '8888 Keystone Crossing, Indianapolis, IN 46240'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Modules for Business Startup
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'business-startup-marketing'
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
  (1, 'Week 1: Entrepreneurship Fundamentals', 'Introduction to business ownership, mindset, and opportunity identification'),
  (2, 'Week 2: Business Planning & LLC Formation', 'Creating business plans, legal structures, and forming your LLC'),
  (3, 'Week 3: Digital Marketing Essentials', 'Social media, branding, and online presence'),
  (4, 'Week 4: Customer Service & Sales', 'Building relationships and closing deals'),
  (5, 'Week 5: Launch & Growth Strategy', 'Final project, pitch preparation, and business launch')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 2. CPR & HEALTH SAFETY TECHNICIAN
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'emergency-health-safety-tech',
  'Emergency Health & Safety Technician',
  'Life-saving skills for healthcare and public safety careers',
  'Earn CPR/AED, First Aid, and OSHA certifications in a 4-week hybrid program.',
  'beginner',
  80,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'instruction_provider', 'Sharen Douglas-Brown',
    'instruction_provider_address', '7009 East 56th St, Suite F, Indianapolis, IN 46226',
    'funding', ARRAY['WIOA', 'WRG', 'Apprenticeship'],
    'cip_code', '51.0999 - Allied Health Diagnostic, Intervention, and Treatment Professions, Other',
    'apprenticeship_type', 'DOL Federally Registered Apprenticeship',
    'apprenticeship_classification', 'Hybrid (Time-based and Competency-based)',
    'rti_provider_type', 'Other',
    'instruction_weeks', 4,
    'instruction_method', 'In-person, Online, E-learning or Distance Learning',
    'active_apprentices', 1,
    'active_apprentices_date', '2025-06-04',
    'weeks', 4,
    'total_hours', 80,
    'hours_per_week', 20,
    'online_available_percent', 60,
    'instructor_led_percent', 20,
    'lab_field_percent', 40,
    'self_study_percent', 40,
    'format', 'DOL Registered Apprenticeship - Hybrid (20% Instructor-Led, 40% Lab/Field, 40% Self-Study)',
    'schedule', ARRAY['Day', 'Evening', 'Weekend', 'Online'],
    'credentials', ARRAY['OSHA 10 - Career Safe', 'CPR Certification', 'Emergency Medical Responder (EMR)'],
    'prerequisites', 'High School Diploma or Equivalent',
    'admission_rate', 100,
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

-- Modules for Emergency Health & Safety
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'emergency-health-safety-tech'
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
  (1, 'Week 1: CPR & AED Fundamentals', 'Adult, child, and infant CPR techniques'),
  (2, 'Week 2: First Aid & Emergency Response', 'Wound care, choking, bleeding control'),
  (3, 'Week 3: OSHA Safety Standards', 'Workplace safety, hazard recognition, PPE'),
  (4, 'Week 4: Public Health & Certification', 'Emergency preparedness and final assessments'),
  (5, 'LIVE INSTRUCTION SESSIONS', 'Scheduled instructor-led training sessions (20% of program)'),
  (6, 'HANDS-ON LAB TRAINING', 'Practical CPR, First Aid, and safety skills training (40% of program)')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 3. DIRECT SUPPORT PROFESSIONAL (DSP)
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'direct-support-professional',
  'Direct Support Professional (DSP)',
  'Compassionate care for individuals with developmental needs',
  'Prepare for a rewarding career supporting individuals with developmental, physical, or emotional needs.',
  'beginner',
  120,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG'],
    'enrollment', 'Rolling - Start anytime',
    'format', 'Hybrid - Online + Hands-on',
    'credentials', ARRAY['DSP Certificate', 'CDSP Pathway'],
    'live_instruction_placeholder', true,
    'hands_on_placeholder', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();

-- Modules for DSP
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'direct-support-professional'
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
  (1, 'Module 1: Introduction to Direct Support', 'Role, responsibilities, and person-centered care'),
  (2, 'Module 2: Communication & Relationship Building', 'Effective communication with individuals and families'),
  (3, 'Module 3: Health & Safety', 'Medication administration, emergency procedures, infection control'),
  (4, 'Module 4: Behavioral Support', 'Understanding behaviors and positive support strategies'),
  (5, 'Module 5: Rights & Ethics', 'Individual rights, dignity, and professional boundaries'),
  (6, 'Module 6: Documentation & Reporting', 'Accurate record-keeping and incident reporting')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Part 1 Complete: Created 3 LMS courses';
  RAISE NOTICE '📚 Courses: Business Startup, CPR/Health Safety, DSP';
END $$;
