-- ============================================================================
-- SEED HOMEPAGE PROGRAMS
-- Adds the 3 featured programs shown on homepage: Barber, CNA, HVAC
-- ============================================================================

-- Delete existing programs if they exist
DELETE FROM programs WHERE slug IN ('barber', 'cna', 'hvac-tech');

-- ============================================================================
-- BARBER APPRENTICESHIP
-- ============================================================================

INSERT INTO programs (
  slug,
  title,
  tagline,
  summary,
  track,
  hours,
  funding,
  bullets,
  cta,
  cover_url
) VALUES (
  'barber',
  'Barber Apprenticeship',
  'Master the art of barbering with comprehensive training',
  'Master the art of barbering with comprehensive training in cutting, styling, and business skills. DOL Registered Apprenticeship - 2,000 hours leading to Indiana State Barber License.',
  'Beauty & Wellness',
  '2000 hours',
  ARRAY['WIOA', 'WRG', 'DOL Apprenticeship'],
  ARRAY[
    'Complete 2,000-hour DOL registered apprenticeship',
    'Master cutting, styling, shaving, and coloring techniques',
    'Learn barbershop business management and operations',
    'Prepare for Indiana State Barber License exam',
    'Hands-on training with experienced master barbers',
    'Job placement assistance upon completion'
  ],
  'Start your career in barbering. 100% funded through WIOA and DOL Apprenticeship programs.',
  '/course-covers/barber-apprenticeship/cover.svg'
);

-- ============================================================================
-- CNA CERTIFICATION
-- ============================================================================

INSERT INTO programs (
  slug,
  title,
  tagline,
  summary,
  track,
  hours,
  funding,
  bullets,
  cta,
  cover_url
) VALUES (
  'cna',
  'CNA Certification',
  'Prepare for your Certified Nursing Assistant certification',
  'Prepare for your Certified Nursing Assistant certification with expert-led training. Fast-track program to enter the healthcare field in just 8 weeks.',
  'Healthcare',
  '120 hours',
  ARRAY['WIOA', 'WRG'],
  ARRAY[
    'Complete 120-hour state-approved CNA training program',
    'Learn patient care, vital signs, and medical terminology',
    'Hands-on clinical experience in healthcare facilities',
    'Prepare for state CNA certification exam',
    'CPR and First Aid certification included',
    'Job placement assistance in hospitals and nursing homes'
  ],
  'Launch your healthcare career. 100% funded through WIOA.',
  '/course-covers/cna-training/cover.svg'
);

-- ============================================================================
-- HVAC TECHNICIAN
-- ============================================================================

INSERT INTO programs (
  slug,
  title,
  tagline,
  summary,
  track,
  hours,
  funding,
  bullets,
  cta,
  cover_url
) VALUES (
  'hvac-tech',
  'HVAC Technician',
  'Learn heating, ventilation, and air conditioning systems',
  'Learn heating, ventilation, and air conditioning systems from industry experts. Comprehensive training leading to EPA 608 certification and career-ready skills.',
  'Skilled Trades',
  '640 hours',
  ARRAY['WIOA', 'WRG', 'Pell Grant'],
  ARRAY[
    'Complete 640-hour comprehensive HVAC training program',
    'Master residential and commercial HVAC systems',
    'Learn installation, maintenance, and repair techniques',
    'Prepare for EPA 608 certification exam',
    'Hands-on training with industry-standard equipment',
    'Job placement assistance with HVAC contractors'
  ],
  'Start your HVAC career. 100% funded through WIOA and Pell Grants.',
  '/course-covers/hvac-tech/cover.svg'
);

-- ============================================================================
-- VERIFY INSERTS
-- ============================================================================

SELECT 
  slug,
  title,
  track,
  hours,
  array_length(funding, 1) as funding_count,
  array_length(bullets, 1) as bullets_count
FROM programs
WHERE slug IN ('barber', 'cna', 'hvac-tech')
ORDER BY slug;
