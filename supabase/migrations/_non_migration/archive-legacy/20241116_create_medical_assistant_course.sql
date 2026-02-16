-- Create Medical Assistant Course
-- Elevate for Humanity Learning Management System

-- ============================================
-- MEDICAL ASSISTANT PROGRAM
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'medical-assistant',
  'Medical Assistant',
  'Launch your healthcare career in 21 weeks',
  'Comprehensive Medical Assistant training program preparing students for entry-level positions in healthcare settings. 100% instructor-led online training covering clinical and administrative skills.',
  'beginner',
  120,
  'published',
  true,
  jsonb_build_object(
    'provider', 'Elevate for Humanity',
    'funding', ARRAY['WIOA', 'WRG'],
    'cip_code', '51.0801 - Medical/Clinical Assistant',
    'weeks', 21,
    'total_hours', 120,
    'hours_per_week', 30,
    'online_available_percent', 100,
    'instructor_led_percent', 100,
    'lab_field_percent', 0,
    'self_study_percent', 0,
    'format', '100% Online - 100% Live Instructor-Led',
    'schedule', ARRAY['Day', 'Evening', 'Weekend', 'Online'],
    'credentials', ARRAY['Certified Community Healthcare Worker (CCHW)', 'Rise Up Credential', 'CPR Certification', 'Certificate of Completion'],
    'prerequisites', 'High School Diploma or Equivalent',
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

-- Modules for Medical Assistant
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'medical-assistant'
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
  (1, 'Week 1-3: Medical Terminology & Anatomy', 'Foundation in medical terminology, body systems, and anatomical terminology'),
  (2, 'Week 4-6: Clinical Procedures I', 'Vital signs, patient intake, medical history documentation'),
  (3, 'Week 7-9: Clinical Procedures II', 'Phlebotomy basics, specimen collection, laboratory procedures'),
  (4, 'Week 10-12: Pharmacology & Medication Administration', 'Drug classifications, dosage calculations, medication safety'),
  (5, 'Week 13-15: Administrative Medical Assisting', 'Medical records, scheduling, insurance billing, coding basics'),
  (6, 'Week 16-18: Electronic Health Records (EHR)', 'EHR systems, documentation, HIPAA compliance, privacy'),
  (7, 'Week 19: Infection Control & Safety', 'Standard precautions, sterilization, OSHA regulations'),
  (8, 'Week 20: Professional Development', 'Resume building, interview skills, workplace professionalism'),
  (9, 'Week 21: Certification Prep & Final Assessment', 'Comprehensive review and certification exam preparation'),
  (10, 'LIVE INSTRUCTION SESSIONS', 'Daily live virtual instruction with certified medical assistant instructors (30 hours/week)')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Add to programs table
INSERT INTO public.programs (slug, title, tagline, description, summary, bullets, funding, hero_image) VALUES
(
  'medical-assistant',
  'Medical Assistant',
  'Launch your healthcare career in 21 weeks',
  'Comprehensive Medical Assistant training program preparing students for entry-level positions in healthcare settings including clinics, hospitals, and physician offices. This 100% instructor-led online program covers both clinical and administrative skills essential for success as a Medical Assistant. Students earn the Certified Community Healthcare Worker (CCHW) credential, Rise Up Credential, and CPR Certification. The program includes medical terminology, clinical procedures, pharmacology, EHR systems, and professional workplace skills. Graduates are prepared for immediate employment in the growing healthcare field.',
  'Earn CCHW, Rise Up, and CPR certifications in 21 weeks with 100% live instructor-led online training.',
  ARRAY[
    '21-week intensive program',
    '120 total instructional hours',
    '30 hours per week of live instruction',
    '100% online with daily live sessions',
    'Clinical and administrative skills training',
    'Medical terminology and anatomy',
    'Phlebotomy and specimen collection',
    'Electronic Health Records (EHR) training',
    'HIPAA compliance and medical ethics',
    'Earn Certified Community Healthcare Worker (CCHW) credential',
    'Rise Up Credential included',
    'CPR Certification included',
    'Job placement assistance included',
    'High school diploma or GED required',
    'Day, evening, weekend, and online options',
    '100% acceptance rate for qualified applicants'
  ],
  ARRAY['WIOA', 'WRG'],
  '/images/medical-assistant.jpg'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  summary = EXCLUDED.summary,
  bullets = EXCLUDED.bullets,
  funding = EXCLUDED.funding,
  hero_image = EXCLUDED.hero_image,
  updated_at = now();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Medical Assistant course and program created successfully';
  RAISE NOTICE '📚 21-week program with 120 hours of live instruction';
  RAISE NOTICE '🎓 Total courses in LMS: 16';
END $$;
