-- ============================================
-- PRODUCTION DATA MIGRATION
-- Run this AFTER the main migrations
-- This creates the actual programs for production
-- ============================================

-- ============================================
-- REAL PROGRAMS
-- ============================================

-- Insert actual programs offered by Elevate for Humanity
INSERT INTO programs (
  name,
  slug,
  description,
  duration,
  total_hours,
  tuition,
  credential,
  status,
  created_at
) VALUES
  (
    'Barbering/Cosmetology',
    'barbering-cosmetology',
    'Comprehensive training in barbering and cosmetology techniques, preparing students for state licensure and professional careers in the beauty industry.',
    '12-18 months',
    1500,
    5000,
    'State Barber License',
    'active',
    NOW()
  ),
  (
    'Certified Nursing Assistant (CNA)',
    'cna',
    'Healthcare training program preparing students for CNA certification and entry-level positions in healthcare facilities.',
    '4-8 weeks',
    120,
    1200,
    'CNA Certification',
    'active',
    NOW()
  ),
  (
    'HVAC Technician',
    'hvac-technician',
    'Heating, ventilation, and air conditioning training with EPA 608 certification and hands-on experience with residential and commercial systems.',
    '8-12 weeks',
    360,
    3500,
    'EPA 608 Certification, NATE Ready',
    'active',
    NOW()
  ),
  (
    'Tax Preparation Specialist',
    'tax-preparation',
    'Professional tax preparation training covering individual and business returns, IRS regulations, and tax software proficiency.',
    '8 weeks',
    240,
    1800,
    'IRS PTIN, AFSP Eligible',
    'active',
    NOW()
  ),
  (
    'Commercial Driver''s License (CDL)',
    'cdl',
    'Class A CDL training with behind-the-wheel instruction, DOT regulations, and preparation for state CDL examination.',
    '4-6 weeks',
    160,
    2500,
    'Class A CDL',
    'active',
    NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  total_hours = EXCLUDED.total_hours,
  tuition = EXCLUDED.tuition,
  credential = EXCLUDED.credential,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check programs were created
DO $$
DECLARE
  v_programs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_programs FROM programs WHERE status = 'active';

  RAISE NOTICE '✅ Production Programs Created:';
  RAISE NOTICE '  Total Active Programs: %', v_programs;
  RAISE NOTICE '';
  RAISE NOTICE 'Programs:';
  RAISE NOTICE '  1. Barbering/Cosmetology (1,500 hours, $5,000)';
  RAISE NOTICE '  2. CNA (120 hours, $1,200)';
  RAISE NOTICE '  3. HVAC Technician (360 hours, $3,500)';
  RAISE NOTICE '  4. Tax Preparation (240 hours, $1,800)';
  RAISE NOTICE '  5. CDL (160 hours, $2,500)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready for student enrollments!';
END $$;
