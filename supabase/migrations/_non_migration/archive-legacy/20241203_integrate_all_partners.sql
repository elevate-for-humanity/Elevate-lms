-- Integrate All 7 Partners as External Modules
-- This script adds partner courses to existing Elevate courses

-- ============================================================================
-- HELPER: Get course IDs (update these with your actual course IDs)
-- ============================================================================

-- You'll need to replace these with actual course IDs from your database
-- Run: SELECT id, title FROM courses; to get your course IDs

-- Example course ID variables (replace with actual IDs)
-- For demonstration, we'll use placeholder UUIDs
-- In production, replace these with: (SELECT id FROM courses WHERE title = 'Course Name')

-- ============================================================================
-- 1. HSI (Health & Safety Institute) - API Mode
-- ============================================================================

-- HSI for CNA Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%CNA%' LIMIT 1),
  'CPR, AED & First Aid Certification',
  'HSI (Health & Safety Institute)',
  'hsi',
  'hybrid', -- Hybrid mode: try API first, fall back to link
  'https://hsi.com/solutions/cpr-aed-first-aid-training/elevate-for-humanity-career-training-institute-nts-class-sign-up',
  'CPR-AED-ADULT',
  'American Heart Association CPR, AED, and First Aid certification. Required for healthcare professionals. Includes Remote Skills Verification (RSV) option.',
  4,
  true, -- Proof required for fallback
  true,
  100
) ON CONFLICT DO NOTHING;

-- HSI for Home Health Aide
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Home Health%' LIMIT 1),
  'CPR & First Aid for Home Health',
  'HSI (Health & Safety Institute)',
  'hsi',
  'hybrid',
  'https://hsi.com/solutions/cpr-aed-first-aid-training/elevate-for-humanity-career-training-institute-nts-class-sign-up',
  'CPR-AED-FIRST-AID',
  'CPR and First Aid training for home health aides. Includes bloodborne pathogens training.',
  4,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. Certiport (Pearson VUE) - API Mode
-- ============================================================================

-- Certiport for IT Support Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%IT%' OR title ILIKE '%Computer%' LIMIT 1),
  'Microsoft Office Specialist Certification',
  'Certiport (Pearson VUE)',
  'certiport',
  'hybrid',
  'https://certiport.com/portal',
  'MOS-WORD-2019',
  'Industry-recognized Microsoft Office certification. Includes practice tests and exam voucher.',
  15,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- Certiport for Customer Service Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Customer Service%' LIMIT 1),
  'Customer Service Certification',
  'Certiport (Pearson VUE)',
  'certiport',
  'hybrid',
  'https://certiport.com/portal',
  'CUSTOMER-SERVICE-CERT',
  'Professional customer service certification recognized by employers nationwide.',
  15,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. CareerSafe (OSHA Training) - API Mode
-- ============================================================================

-- CareerSafe for HVAC Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%HVAC%' LIMIT 1),
  'OSHA 10-Hour Construction Safety',
  'CareerSafe',
  'careersafe',
  'hybrid',
  'https://www.careersafeonline.com/campus/signin',
  'OSHA-10-CONSTRUCTION',
  'OSHA 10-hour safety training for construction and HVAC workers. DOL-authorized certification.',
  10,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- CareerSafe for Building Maintenance
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Building%' OR title ILIKE '%Maintenance%' LIMIT 1),
  'OSHA 10-Hour General Industry',
  'CareerSafe',
  'careersafe',
  'hybrid',
  'https://www.careersafeonline.com/campus/signin',
  'OSHA-10-GENERAL',
  'OSHA 10-hour safety training for general industry and building maintenance workers.',
  10,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- CareerSafe for Healthcare Programs
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%CNA%' OR title ILIKE '%Medical%' LIMIT 1),
  'Healthcare Safety & Bloodborne Pathogens',
  'CareerSafe',
  'careersafe',
  'hybrid',
  'https://www.careersafeonline.com/campus/signin',
  'HEALTHCARE-SAFETY',
  'OSHA-compliant healthcare safety training including bloodborne pathogens.',
  8,
  true,
  true,
  101
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. Milady RISE - Link Mode (No API Yet)
-- ============================================================================

-- Milady for Barbering Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Barber%' LIMIT 1),
  'Client Well-Being & Safety',
  'Milady RISE',
  'milady',
  'link', -- Link mode only until API available
  'https://miladytraining.com',
  NULL,
  'Essential safety and wellness training for barbers and beauty professionals. Use promo code: efhcti-rise295',
  3.5,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- Milady for Cosmetology Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Cosmetology%' OR title ILIKE '%Beauty%' LIMIT 1),
  'Client Well-Being & Safety',
  'Milady RISE',
  'milady',
  'link',
  'https://miladytraining.com',
  NULL,
  'Essential safety and wellness training for cosmetologists. Use promo code: efhcti-rise295',
  3.5,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- Milady for Curvature Body Sculpting
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Curvature%' OR title ILIKE '%Body Sculpt%' LIMIT 1),
  'Client Well-Being & Safety for Body Sculpting',
  'Milady RISE',
  'milady',
  'link',
  'https://miladytraining.com',
  NULL,
  'Safety protocols and client care for body sculpting professionals. Use promo code: efhcti-rise295',
  3.5,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. JRI (Janitorial Resource Institute) - API Mode
-- ============================================================================

-- JRI for Janitorial Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Janitor%' OR title ILIKE '%Custodial%' LIMIT 1),
  'Professional Janitorial Training',
  'JRI (Janitorial Resource Institute)',
  'jri',
  'hybrid',
  'https://jri.org',
  'JRI-BASIC',
  'Professional janitorial and custodial training. Free course provided by JRI.',
  8,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. NRF RISE Up - API Mode
-- ============================================================================

-- NRF for Retail Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Retail%' OR title ILIKE '%Sales%' LIMIT 1),
  'Retail Industry Fundamentals',
  'NRF RISE Up',
  'nrf',
  'hybrid',
  'https://nrf.com/riseup',
  'NRF-FUNDAMENTALS',
  'Retail industry skills and education. Free training from the National Retail Federation.',
  10,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- NRF for Customer Service Program
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Customer Service%' LIMIT 1),
  'Retail Customer Service Excellence',
  'NRF RISE Up',
  'nrf',
  'hybrid',
  'https://nrf.com/riseup',
  'NRF-CUSTOMER-SERVICE',
  'Customer service skills for retail environments. Free training from NRF.',
  8,
  true,
  false, -- Optional if Certiport is primary
  101
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. NDS (National Drug Screening) - API Mode
-- ============================================================================

-- NDS for Healthcare Programs
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%CNA%' OR title ILIKE '%Medical%' OR title ILIKE '%Health%' LIMIT 1),
  'Drug-Free Workplace Training for Healthcare',
  'National Drug Screening',
  'nds',
  'hybrid',
  'https://nationaldrugscreening.com',
  'NDS-HEALTHCARE',
  'Drug-free workplace compliance training for healthcare workers.',
  4,
  true,
  true,
  102
) ON CONFLICT DO NOTHING;

-- NDS for Barber/Beauty Programs
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%Barber%' OR title ILIKE '%Beauty%' OR title ILIKE '%Cosmetology%' LIMIT 1),
  'Drug-Free Workplace Training for Barber/Beauty',
  'National Drug Screening',
  'nds',
  'hybrid',
  'https://nationaldrugscreening.com',
  'NDS-BARBER-BEAUTY',
  'Drug-free workplace compliance training for barber and beauty professionals.',
  2,
  true,
  true,
  101
) ON CONFLICT DO NOTHING;

-- NDS for Skilled Trades
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%HVAC%' OR title ILIKE '%Building%' OR title ILIKE '%Maintenance%' LIMIT 1),
  'Drug-Free Workplace Training for Skilled Trades',
  'National Drug Screening',
  'nds',
  'hybrid',
  'https://nationaldrugscreening.com',
  'NDS-SKILLED-TRADES',
  'Drug-free workplace compliance training for skilled trades workers.',
  2,
  true,
  true,
  102
) ON CONFLICT DO NOTHING;

-- NDS for CDL/Transportation
INSERT INTO external_partner_modules (
  course_id,
  title,
  partner_name,
  partner_type,
  delivery_mode,
  launch_url,
  external_course_code,
  description,
  hours,
  requires_proof,
  is_required,
  sort_order
) VALUES (
  (SELECT id FROM courses WHERE title ILIKE '%CDL%' OR title ILIKE '%Driver%' OR title ILIKE '%Transport%' LIMIT 1),
  'DOT/CDL Drug & Alcohol Awareness',
  'National Drug Screening',
  'nds',
  'hybrid',
  'https://nationaldrugscreening.com',
  'NDS-DOT-CDL',
  'DOT-required drug and alcohol awareness training for commercial drivers.',
  3,
  true,
  true,
  100
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- Summary Query: View All Integrated Partners
-- ============================================================================

-- Run this to see all partner modules that were added:
-- SELECT 
--   c.title as course_title,
--   epm.title as module_title,
--   epm.partner_name,
--   epm.delivery_mode,
--   epm.hours,
--   epm.is_required
-- FROM external_partner_modules epm
-- JOIN courses c ON c.id = epm.course_id
-- ORDER BY c.title, epm.sort_order;

-- ============================================================================
-- Notes for Production Deployment
-- ============================================================================

-- 1. Update course_id lookups to match your actual course titles
-- 2. Verify launch URLs are correct for each partner
-- 3. Update external_course_code values when API credentials are obtained
-- 4. Test each module with a student account
-- 5. Configure API credentials in environment variables
-- 6. Set up progress sync cron job for API-based partners

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================

-- To remove all partner modules:
-- DELETE FROM external_partner_modules WHERE partner_type IN ('hsi', 'certiport', 'careersafe', 'milady', 'jri', 'nrf', 'nds');
