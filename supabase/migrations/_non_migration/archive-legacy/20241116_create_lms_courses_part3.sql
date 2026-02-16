-- Create LMS Courses - Part 3: Barber, Public Safety Reentry, HVAC
-- Elevate for Humanity Learning Management System

-- ============================================
-- 1. BARBER APPRENTICESHIP PROGRAM (2,000-HOUR)
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'barber-apprenticeship-full',
  'Barber Apprenticeship Program',
  'Master barbering through registered apprenticeship',
  'Earn while you learn in a 2,000-hour DOL-registered barber apprenticeship. Combines instructional training with extensive on-the-job training at licensed barbershops.',
  'beginner',
  2000,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'Apprenticeship'],
    'cip_code', '12.0402 - Barbering/Barber',
    'apprenticeship_type', 'DOL Federally Registered Apprenticeship',
    'apprenticeship_classification', 'Hybrid (Time-based and Competency-based)',
    'rti_provider_type', 'Other',
    'instruction_weeks', 12,
    'instruction_method', 'In-person, Online, E-learning or Distance Learning',
    'active_apprentices', 3,
    'active_apprentices_date', '2025-06-16',
    'weeks', 15,
    'total_hours', 2000,
    'hours_per_week', 40,
    'online_available_percent', 40,
    'instructor_led_percent', 30,
    'lab_field_percent', 30,
    'self_study_percent', 40,
    'format', 'DOL Registered Apprenticeship - Hybrid (30% Instructor-Led, 30% Lab/Field, 40% Self-Study)',
    'schedule', ARRAY['Day', 'Evening', 'Weekend', 'Online'],
    'credentials', ARRAY['Registered Barber License', 'Rise Up Credential', 'DOL Apprenticeship Certificate'],
    'prerequisites', 'High School Diploma or Equivalent',
    'admission_rate', 10,
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
    'hands_on_location', 'Licensed Barbershops (Partner Locations)',
    'location', '8888 Keystone Crossing, Indianapolis, IN 46240'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Modules for Barber Apprenticeship (Instructional Phase)
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'barber-apprenticeship-full'
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
  (1, 'Week 1-2: Professional Foundations', 'History of barbering, professional image, shop management basics'),
  (2, 'Week 3-4: Infection Control & Safety', 'Sanitation, sterilization, OSHA standards, state board regulations'),
  (3, 'Week 5-6: Hair & Scalp Science', 'Hair structure, growth cycles, scalp conditions, product chemistry'),
  (4, 'Week 7-8: Basic Cutting Techniques', 'Clipper work, scissor techniques, fading, blending'),
  (5, 'Week 9-10: Advanced Cutting & Styling', 'Texturizing, razor work, beard trimming, styling products'),
  (6, 'Week 11: Shaving & Facial Services', 'Straight razor shaving, hot towel treatments, facial massage'),
  (7, 'Week 12: Business & State Board Prep', 'Client relations, pricing, marketing, state exam preparation'),
  (8, 'LIVE INSTRUCTION SESSIONS', 'In-person and virtual instruction with licensed barber instructors'),
  (9, 'HANDS-ON TRAINING - BARBERSHOP', 'On-the-job training at licensed partner barbershops (1,500+ hours)')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 2. PUBLIC SAFETY REENTRY SPECIALIST
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'public-safety-reentry-specialist',
  'Public Safety Reentry Specialist Program',
  'Career pathways for justice-involved individuals',
  'Trauma-informed Peer Recovery Specialist training for justice-impacted individuals and reentry professionals. O*NET 21-1093.00 aligned.',
  'beginner',
  180,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'JRI'],
    'cip_code', '43.0112 - Securities Services Administration/Management',
    'onet_code', '21-1093.00 - Social and Human Service Assistants',
    'days', 45,
    'hours_per_week', 15,
    'format', '100% Online with Tutoring Support',
    'credentials', ARRAY['Certified Peer Recovery Specialist (CPRS)', 'Certificate of Completion'],
    'admission_rate', 100,
    'prerequisites', 'None',
    'live_instruction_placeholder', true,
    'hands_on_placeholder', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();

-- Modules for Public Safety Reentry
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'public-safety-reentry-specialist'
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
  (1, 'Week 1-2: Foundations of Peer Recovery', 'Recovery principles, lived experience, ethical boundaries'),
  (2, 'Week 3-4: Trauma-Informed Care', 'Understanding trauma, resilience, healing-centered engagement'),
  (3, 'Week 5-6: Crisis Response & De-escalation', 'Crisis intervention, suicide prevention, emergency protocols'),
  (4, 'Week 7-8: Peer Coaching & Mentorship', 'Motivational interviewing, active listening, goal setting'),
  (5, 'Week 9-10: Reentry Navigation', 'Housing, employment, benefits, legal system navigation'),
  (6, 'Week 11-12: Community Outreach & Advocacy', 'Resource connection, community organizing, systems advocacy'),
  (7, 'Week 13-14: Workforce Coaching', 'Resume building, interview prep, workplace readiness'),
  (8, 'Week 15: CPRS Certification Prep', 'Final exam preparation and certification completion'),
  (9, 'LIVE INSTRUCTION SESSIONS', 'Weekly virtual sessions with certified peer recovery specialists')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ============================================
-- 3. HVAC / 2EXCLUSIVE APPRENTICESHIP
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'hvac-technician',
  'HVAC Technician',
  'Specialized sanitation and HVAC training for high-risk environments',
  'Advanced sanitation, infection control, and HVAC skills for critical sectors including hospitals, military bases, and government facilities.',
  'beginner',
  125,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG', 'Apprenticeship'],
    'cip_code', '15.0501 - Heating, Ventilation, Air Conditioning and Refrigeration Engineering Technology/Technician',
    'apprenticeship_type', 'DOL Federally Registered Apprenticeship',
    'apprenticeship_classification', 'Hybrid (Time-based and Competency-based)',
    'rti_provider_type', 'Other',
    'instruction_weeks', 50,
    'instruction_method', 'In-person, Online, E-learning or Distance Learning',
    'active_apprentices', 10,
    'active_apprentices_date', '2025-02-03',
    'days', 60,
    'total_hours', 125,
    'hours_per_week', 12,
    'online_available_percent', 30,
    'instructor_led_percent', 10,
    'lab_field_percent', 5,
    'self_study_percent', 85,
    'format', 'DOL Registered Apprenticeship - Hybrid (10% Instructor-Led, 5% Lab/Field, 85% Self-Study)',
    'schedule', ARRAY['Day', 'Evening', 'Weekend', 'Online'],
    'credentials', ARRAY['CPR Certification', 'Rise Up Credential', 'OSHA 30', 'Residential HVAC Certification 1', 'Residential HVAC Certification 2 - Refrigeration Diagnostics'],
    'prerequisites', 'None',
    'admission_rate', 100,
    'career_counseling', true,
    'job_placement', true,
    'placement_assistance', true,
    'part_time_allowed', true,
    'general_public', true,
    'industry_collaboration', true,
    'accredited', true,
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

-- Modules for HVAC Technician
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'hvac-technician'
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
  (1, 'Week 1-2: OSHA Compliance & Safety', 'OSHA 10/30 certification, workplace safety, PPE'),
  (2, 'Week 3-4: Infection Control Protocols', 'Hospital-grade sanitation, CDC guidelines, isolation procedures'),
  (3, 'Week 5-6: HAZMAT & Hazardous Waste', 'Hazardous material handling, disposal, emergency response'),
  (4, 'Week 7-8: Holistic Wellness Cleaning', 'Eco-friendly practices, green cleaning, indoor air quality'),
  (5, 'Week 9-10: HVAC Fundamentals', 'Heating and cooling systems, ventilation, air filtration'),
  (6, 'Week 11-12: Regulatory Compliance', 'EPA regulations, state codes, documentation requirements'),
  (7, 'Week 13-14: High-Risk Environment Operations', 'Military, hospital, government facility protocols'),
  (8, 'Week 15-16: Final Certification & Practicum', 'Comprehensive assessment and field practicum'),
  (9, 'LIVE INSTRUCTION SESSIONS', 'Virtual and in-person safety and compliance training'),
  (10, 'HANDS-ON FIELD TRAINING', 'Supervised work in high-risk environments')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Part 3 Complete: Created 3 more LMS courses';
  RAISE NOTICE '📚 Courses: Barber Apprenticeship, Public Safety Reentry, HVAC/2Exclusive';
  RAISE NOTICE '🎓 Total courses created: 9';
END $$;
