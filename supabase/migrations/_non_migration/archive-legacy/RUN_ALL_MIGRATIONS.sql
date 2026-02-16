-- ============================================
-- RUN ALL MIGRATIONS - COMPLETE SETUP
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- This will set up your entire database in one go
-- ============================================

-- STEP 1: Add all 16 ETPL programs
-- ============================================

INSERT INTO programs (
  slug,
  title,
  tagline,
  summary,
  description,
  bullets,
  funding,
  duration_hours,
  status
) VALUES

-- 1. Barber Apprenticeship (2000 hours)
(
  'barber-apprenticeship',
  'Barber Apprenticeship Program',
  'Master barbering through DOL Federally Registered Apprenticeship',
  'Complete 2,000-hour DOL-registered apprenticeship combining classroom instruction with paid on-the-job training.',
  'The Barber Apprenticeship Program is a DOL Federally Registered Apprenticeship that provides comprehensive training in all aspects of professional barbering. This 2,000-hour program combines classroom instruction with hands-on experience in a real barbershop environment.',
  ARRAY[
    'DOL Federally Registered Apprenticeship',
    '2,000 hours of training (classroom + OJT)',
    'Earn while you learn - paid apprenticeship',
    'Indiana State Barber License preparation',
    'Master cuts, fades, shaves, and styling',
    'Business and customer service skills',
    'Employer partnerships for job placement'
  ],
  ARRAY['WIOA', 'Apprenticeship', 'SEAL', 'WRG'],
  2000,
  'published'
),

-- 2. HVAC Technician
(
  'hvac-technician',
  'HVAC Technician',
  'Master heating, ventilation, and air conditioning systems',
  '640-hour program covering HVAC installation, maintenance, and repair with EPA 608 certification.',
  'Comprehensive HVAC training program preparing students for careers in heating, ventilation, and air conditioning. Learn installation, maintenance, troubleshooting, and repair of residential and commercial HVAC systems.',
  ARRAY[
    'EPA 608 Certification',
    'OSHA 10-Hour Safety',
    'Hands-on equipment training',
    'Electrical systems and controls',
    'Refrigeration principles',
    'System diagnostics and repair',
    'Job placement assistance'
  ],
  ARRAY['WIOA', 'WRG', 'Youth', 'Reentry'],
  640,
  'published'
),

-- 3. CNA Certification
(
  'cna-certification',
  'Certified Nursing Assistant (CNA)',
  'Start your healthcare career as a Certified Nursing Assistant',
  '120-hour program leading to Indiana CNA certification and immediate employment opportunities.',
  'Fast-track CNA certification program preparing students for immediate employment in healthcare facilities. Learn patient care, vital signs, medical terminology, and clinical skills.',
  ARRAY[
    'Indiana State CNA Certification',
    '120 hours of training',
    'Clinical externship included',
    'Patient care fundamentals',
    'Medical terminology',
    'Infection control',
    'Immediate job placement'
  ],
  ARRAY['WIOA', 'SNAP/TANF', 'WRG', 'JRI'],
  120,
  'published'
),

-- 4. CDL Truck Driving
(
  'cdl-truck-driving',
  'CDL Truck Driving',
  'Professional truck driver training leading to Class A CDL',
  '160-hour program preparing students for Class A Commercial Driver License and immediate employment.',
  'Comprehensive CDL training program covering all aspects of professional truck driving. Learn vehicle operation, safety procedures, DOT regulations, and earn your Class A CDL.',
  ARRAY[
    'Class A CDL License',
    '160 hours of training',
    'Behind-the-wheel training',
    'DOT regulations and compliance',
    'Pre-trip inspections',
    'Defensive driving',
    'Job placement with carriers'
  ],
  ARRAY['WIOA', 'WRG', 'Youth', 'Reentry'],
  160,
  'published'
),

-- 5. Medical Assistant
(
  'medical-assistant',
  'Medical Assistant',
  'Comprehensive medical assistant training for clinical and administrative roles',
  '720-hour program covering both clinical and administrative medical assisting skills.',
  'Complete medical assistant training program preparing students for both clinical and administrative roles in healthcare settings. Includes externship and national certification preparation.',
  ARRAY[
    'National Certification prep',
    '720 hours of training',
    'Clinical externship',
    'EKG and phlebotomy skills',
    'Medical office procedures',
    'Electronic health records',
    'Job placement assistance'
  ],
  ARRAY['WIOA', 'WRG', 'Youth', 'Reentry'],
  720,
  'published'
),

-- 6. Phlebotomy Technician
(
  'phlebotomy-technician',
  'Phlebotomy Technician',
  'Specialized training in blood collection and laboratory procedures',
  '165-hour program leading to national phlebotomy certification.',
  'Focused phlebotomy training program teaching proper blood collection techniques, laboratory procedures, and patient interaction. Includes clinical externship.',
  ARRAY[
    'National Phlebotomy Certification',
    '165 hours of training',
    'Clinical externship',
    'Venipuncture techniques',
    'Laboratory safety',
    'Patient care',
    'Immediate employment opportunities'
  ],
  ARRAY['WIOA', 'WRG', 'Healthcare'],
  165,
  'published'
),

-- 7. EKG Technician
(
  'ekg-technician',
  'EKG Technician',
  'Specialized cardiovascular diagnostic training',
  '165-hour program teaching electrocardiogram procedures and interpretation.',
  'Specialized EKG technician training covering cardiac anatomy, EKG equipment operation, and rhythm interpretation. Includes clinical externship in healthcare facilities.',
  ARRAY[
    'National EKG Certification',
    '165 hours of training',
    'Clinical externship',
    'Cardiac anatomy and physiology',
    'EKG equipment operation',
    'Rhythm interpretation',
    'Healthcare facility placement'
  ],
  ARRAY['WIOA', 'WRG', 'Healthcare'],
  165,
  'published'
),

-- 8. Patient Care Technician
(
  'patient-care-technician',
  'Patient Care Technician (PCT)',
  'Multi-skilled healthcare support training',
  '600-hour program combining CNA, EKG, and phlebotomy skills.',
  'Comprehensive patient care technician program combining multiple healthcare skills. Learn CNA, EKG, and phlebotomy in one complete training program.',
  ARRAY[
    'CNA + EKG + Phlebotomy',
    '600 hours of training',
    'Multiple certifications',
    'Clinical externship',
    'Hospital and clinic skills',
    'Patient care excellence',
    'High-demand career path'
  ],
  ARRAY['WIOA', 'SNAP/TANF', 'WRG'],
  600,
  'published'
),

-- 9. Pharmacy Technician
(
  'pharmacy-technician',
  'Pharmacy Technician',
  'Retail and clinical pharmacy training',
  '600-hour program leading to national pharmacy technician certification.',
  'Complete pharmacy technician training covering medication dispensing, pharmacy calculations, and patient safety. Includes retail and clinical pharmacy externship.',
  ARRAY[
    'National Pharmacy Tech Certification',
    '600 hours of training',
    'Pharmacy externship',
    'Medication dispensing',
    'Pharmacy calculations',
    'Insurance and billing',
    'Retail and hospital placement'
  ],
  ARRAY['WIOA', 'WRG', 'Healthcare'],
  600,
  'published'
),

-- 10. Clinical Medical Assistant
(
  'clinical-medical-assistant',
  'Clinical Medical Assistant',
  'Focused clinical skills for medical offices',
  '480-hour program emphasizing clinical medical assisting procedures.',
  'Clinical-focused medical assistant training emphasizing hands-on patient care skills. Learn vital signs, injections, EKG, phlebotomy, and clinical procedures.',
  ARRAY[
    'Clinical MA Certification',
    '480 hours of training',
    'Clinical externship',
    'Vital signs and injections',
    'EKG and phlebotomy',
    'Clinical procedures',
    'Medical office placement'
  ],
  ARRAY['WIOA', 'WRG', 'Youth', 'Reentry'],
  480,
  'published'
),

-- 11. Administrative Medical Assistant
(
  'administrative-medical-assistant',
  'Administrative Medical Assistant',
  'Medical office administration and management',
  '480-hour program focusing on medical office procedures and administration.',
  'Administrative medical assistant training focusing on front-office skills, medical billing, coding, and office management. Perfect for organized, detail-oriented individuals.',
  ARRAY[
    'Administrative MA Certification',
    '480 hours of training',
    'Office externship',
    'Medical billing and coding',
    'Electronic health records',
    'Appointment scheduling',
    'Medical office careers'
  ],
  ARRAY['WIOA', 'WRG', 'Youth', 'Reentry'],
  480,
  'published'
),

-- 12. Tax Preparation & Financial Services
(
  'tax-preparation',
  'Tax Preparation & Financial Services',
  'IRS-aligned tax preparation and financial literacy training',
  '160-hour program teaching tax preparation, financial planning, and business services.',
  'Comprehensive tax preparation training aligned with IRS VITA program. Learn individual and business tax preparation, financial planning, and bookkeeping.',
  ARRAY[
    'IRS VITA Certification',
    '160 hours of training',
    'Tax software training',
    'Individual and business taxes',
    'Financial planning basics',
    'Bookkeeping skills',
    'Seasonal and year-round work'
  ],
  ARRAY['WIOA', 'WRG', 'Youth', 'Reentry'],
  160,
  'published'
),

-- 13. Business Start-Up & Marketing
(
  'business-startup',
  'Business Start-Up & Marketing',
  'Entrepreneurship and small business development',
  '240-hour program teaching business planning, marketing, and entrepreneurship.',
  'Entrepreneurship training program teaching business planning, marketing strategies, financial management, and digital presence. Perfect for aspiring business owners.',
  ARRAY[
    'Business Plan Development',
    '240 hours of training',
    'Marketing strategies',
    'Financial management',
    'Digital marketing',
    'Social media for business',
    'Launch your own business'
  ],
  ARRAY['WIOA Youth', 'Reentry', 'TANF'],
  240,
  'published'
),

-- 14. Professional Esthetician
(
  'professional-esthetician',
  'Professional Esthetician',
  'Advanced skincare and beauty services training',
  '700-hour program leading to Indiana esthetician license.',
  'Complete esthetician training program covering skincare, facials, waxing, and beauty treatments. Prepare for Indiana state esthetician licensure.',
  ARRAY[
    'Indiana Esthetician License',
    '700 hours of training',
    'Skincare and facials',
    'Waxing and hair removal',
    'Makeup application',
    'Spa treatments',
    'Salon and spa placement'
  ],
  ARRAY['WIOA', 'WRG'],
  700,
  'published'
),

-- 15. Beauty & Career Educator
(
  'beauty-educator',
  'Beauty & Career Educator',
  'Train the next generation of beauty professionals',
  '600-hour program preparing beauty professionals to become instructors.',
  'Advanced training for licensed cosmetologists and estheticians who want to become beauty educators. Learn teaching methods, curriculum development, and salon management.',
  ARRAY[
    'Instructor License preparation',
    '600 hours of training',
    'Teaching methodologies',
    'Curriculum development',
    'Salon management',
    'Student mentorship',
    'Beauty school careers'
  ],
  ARRAY['WIOA', 'WRG', 'Apprenticeship-bridge'],
  600,
  'published'
),

-- 16. Public Safety Reentry Specialist
(
  'reentry-specialist',
  'Public Safety Reentry Specialist',
  'Support individuals transitioning from incarceration',
  '320-hour program training reentry support professionals.',
  'Specialized training for individuals who want to support formerly incarcerated individuals. Learn case management, resource navigation, and community reintegration strategies.',
  ARRAY[
    'Reentry Specialist Certification',
    '320 hours of training',
    'Case management skills',
    'Resource navigation',
    'Trauma-informed care',
    'Community partnerships',
    'Probation and reentry careers'
  ],
  ARRAY['JRI', 'WIOA', 'Reentry', 'EDRC'],
  320,
  'published'
)

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  bullets = EXCLUDED.bullets,
  funding = EXCLUDED.funding,
  duration_hours = EXCLUDED.duration_hours,
  status = EXCLUDED.status;

-- STEP 2: Add CIP/SOC code columns
-- ============================================

ALTER TABLE programs
ADD COLUMN IF NOT EXISTS cip_code TEXT,
ADD COLUMN IF NOT EXISTS soc_code TEXT,
ADD COLUMN IF NOT EXISTS funding_eligibility TEXT[];

-- STEP 3: Populate CIP/SOC codes
-- ============================================

UPDATE programs SET 
  cip_code = '12.0402 – Barbering',
  soc_code = '39-5011 – Barbers',
  funding_eligibility = ARRAY['WIOA', 'Apprenticeship', 'SEAL', 'WRG']
WHERE slug = 'barber-apprenticeship';

UPDATE programs SET 
  cip_code = '47.0201 – Heating, Air Conditioning, Ventilation',
  soc_code = '49-9021 – HVAC Mechanics & Installers',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Youth', 'Reentry']
WHERE slug = 'hvac-technician';

UPDATE programs SET 
  cip_code = '51.2602 – Home Health / Health Services',
  soc_code = '31-1131 – Nursing Assistants',
  funding_eligibility = ARRAY['WIOA', 'SNAP/TANF', 'WRG', 'JRI']
WHERE slug = 'cna-certification';

UPDATE programs SET 
  cip_code = '49.0205 – Truck and Bus Driver Training',
  soc_code = '53-3032 – Heavy Truck Drivers',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Youth', 'Reentry']
WHERE slug = 'cdl-truck-driving';

UPDATE programs SET 
  cip_code = '51.0801 – Medical Assisting',
  soc_code = '31-9092 – Medical Assistants',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Youth', 'Reentry']
WHERE slug = 'medical-assistant';

UPDATE programs SET 
  cip_code = '51.1009 – Phlebotomy Technician',
  soc_code = '31-9097 – Phlebotomists',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Healthcare']
WHERE slug = 'phlebotomy-technician';

UPDATE programs SET 
  cip_code = '51.0901 – Cardiovascular Technology',
  soc_code = '29-2031 – Cardiovascular Technologists',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Healthcare']
WHERE slug = 'ekg-technician';

UPDATE programs SET 
  cip_code = '51.0808 – Healthcare Support',
  soc_code = '31-9099 – Healthcare Support Workers',
  funding_eligibility = ARRAY['WIOA', 'SNAP/TANF', 'WRG']
WHERE slug = 'patient-care-technician';

UPDATE programs SET 
  cip_code = '51.0805 – Pharmacy Technician',
  soc_code = '29-2052 – Pharmacy Technicians',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Healthcare']
WHERE slug = 'pharmacy-technician';

UPDATE programs SET 
  cip_code = '51.0801 – Medical Assisting',
  soc_code = '31-9092 – Medical Assistants',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Youth', 'Reentry']
WHERE slug = 'clinical-medical-assistant';

UPDATE programs SET 
  cip_code = '51.0716 – Medical Administrative Assistant',
  soc_code = '43-6013 – Medical Secretaries',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Youth', 'Reentry']
WHERE slug = 'administrative-medical-assistant';

UPDATE programs SET 
  cip_code = '52.0301 – Accounting Technology',
  soc_code = '13-2082 – Tax Preparers',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Youth', 'Reentry']
WHERE slug = 'tax-preparation';

UPDATE programs SET 
  cip_code = '52.0703 – Entrepreneurship / Small Business',
  soc_code = '11-1021 – General Managers',
  funding_eligibility = ARRAY['WIOA Youth', 'Reentry', 'TANF']
WHERE slug = 'business-startup';

UPDATE programs SET 
  cip_code = '12.0409 – Aesthetician/Esthetician',
  soc_code = '39-5094 – Skincare Specialists',
  funding_eligibility = ARRAY['WIOA', 'WRG']
WHERE slug = 'professional-esthetician';

UPDATE programs SET 
  cip_code = '12.0401 – Cosmetology',
  soc_code = '39-5094 – Skincare Specialists',
  funding_eligibility = ARRAY['WIOA', 'WRG', 'Apprenticeship-bridge']
WHERE slug = 'beauty-educator';

UPDATE programs SET 
  cip_code = '43.9999 – Security / Public Safety',
  soc_code = '21-1099 – Community & Social Service Specialists',
  funding_eligibility = ARRAY['JRI', 'WIOA', 'Reentry', 'EDRC']
WHERE slug = 'reentry-specialist';

-- STEP 4: Create lesson_progress table
-- ============================================

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_id bigint,
  lesson_id bigint NOT NULL,
  duration_seconds integer,
  watched_seconds integer,
  completed boolean NOT NULL DEFAULT false,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_unique UNIQUE (student_id, lesson_id)
);

ALTER TABLE public.lesson_progress
  ADD CONSTRAINT lesson_progress_student_fkey
  FOREIGN KEY (student_id) REFERENCES auth.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON public.lesson_progress(completed);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
  ON public.lesson_progress FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own progress"
  ON public.lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own progress"
  ON public.lesson_progress FOR UPDATE
  USING (auth.uid() = student_id);

-- STEP 5: Create course_completion_status view
-- ============================================

CREATE OR REPLACE VIEW public.course_completion_status AS
SELECT
  e.user_id as student_id,
  e.course_id,
  c.title as course_title,
  COUNT(DISTINCT l.id) FILTER (WHERE COALESCE(l.is_required, true)) as total_required_lessons,
  COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed AND COALESCE(l.is_required, true)) as completed_required_lessons,
  (COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed AND COALESCE(l.is_required, true))
   >=
   COUNT(DISTINCT l.id) FILTER (WHERE COALESCE(l.is_required, true))) as is_course_completed,
  MAX(lp.last_watched_at) as last_activity_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
LEFT JOIN modules m ON m.course_id = e.course_id
LEFT JOIN lessons l ON l.module_id = m.id
LEFT JOIN lesson_progress lp
  ON lp.student_id = e.user_id
  AND lp.lesson_id = l.id
GROUP BY e.user_id, e.course_id, c.title;

GRANT SELECT ON public.course_completion_status TO authenticated;

-- ============================================
-- DONE! All migrations complete
-- ============================================

SELECT 'SUCCESS! All migrations completed. Check programs table:' as status;
SELECT COUNT(*) as total_programs FROM programs;
SELECT title FROM programs ORDER BY title;
