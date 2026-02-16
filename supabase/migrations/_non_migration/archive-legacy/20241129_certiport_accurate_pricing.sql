-- ============================================================================
-- CERTIPORT ACCURATE PRICING
-- Based on actual Certiport OnVUE pricing from Elizabeth's account
-- ============================================================================

-- Update test costs with accurate pricing

-- Adobe Certifications - $150 each
UPDATE certiport_tests SET test_cost = 150.00 WHERE test_code LIKE 'ADOBE-%';

-- IC3 Digital Literacy - $79 each
UPDATE certiport_tests SET test_cost = 79.00 WHERE test_code LIKE 'IC3-%';

-- Entrepreneurship and Small Business - $90
UPDATE certiport_tests SET test_cost = 90.00 WHERE test_code = 'ESB-CERT';

-- Microsoft Office Specialist - $150 each
UPDATE certiport_tests SET test_cost = 150.00 WHERE test_code LIKE 'MOS-%';
UPDATE certiport_tests SET test_cost = 150.00 WHERE test_code = 'MS-FUNDAMENTALS';
UPDATE certiport_tests SET test_cost = 150.00 WHERE test_code = 'MCE';

-- Intuit QuickBooks - $150
UPDATE certiport_tests SET test_cost = 150.00 WHERE test_code = 'QUICKBOOKS-CERT';

-- Critical Career Skills - $85 each
UPDATE certiport_tests SET test_cost = 85.00 WHERE test_code = 'CAREER-SKILLS';
UPDATE certiport_tests SET test_cost = 85.00 WHERE test_name = 'Professional Communication';

-- PMI Project Management - $125
UPDATE certiport_tests SET test_cost = 125.00 WHERE test_code = 'PMI-READY';

-- Career-specific certifications - $90 each
UPDATE certiport_tests SET test_cost = 90.00 WHERE test_code IN ('AGRI-TECH', 'HEALTH-SCIENCES', 'HOSPITALITY-CULINARY');

-- IT/Tech certifications - $150 each
UPDATE certiport_tests SET test_cost = 150.00 WHERE test_code IN ('ITS-NETWORK-SECURITY', 'CISCO-CCST', 'META-MARKETING', 'SWIFT-CERT', 'UNITY-CERT', 'AUTODESK-AUTOCAD');

-- Add new certifications from OnVUE catalog

-- Generative AI Foundations
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Generative AI Foundations',
  'GEN-AI-FOUNDATIONS',
  'Demonstrates fundamental understanding of Generative AI, its applications, and responsible management',
  true,
  70,
  85.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing', 'tax-prep-financial-services')
ON CONFLICT DO NOTHING;

-- Professional Communication
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Professional Communication',
  'PROF-COMM',
  'Validates key communication principles and skills necessary for workplace effectiveness',
  true,
  70,
  85.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing', 'barber', 'barber-apprenticeship-wrg', 'cna', 'cna-training-wrg', 'direct-support-professional')
ON CONFLICT DO NOTHING;

-- Medical Administrative Assistant
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Medical Administrative Assistant',
  'MEDICAL-ADMIN',
  'Validates essential skills and knowledge for medical administrative assistant roles',
  true,
  70,
  90.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('medical-assistant', 'cna', 'cna-training-wrg')
ON CONFLICT DO NOTHING;

-- World Association of Master Chefs - Culinary Foundations
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Culinary Foundations (WAMC)',
  'WAMC-CULINARY',
  'Certifies essential knowledge and skills for working professionally in a commercial kitchen',
  true,
  70,
  90.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('barber', 'barber-apprenticeship-wrg')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE PAYMENT AMOUNTS IN PARTNER LMS PROVIDERS
-- ============================================================================

UPDATE partner_lms_providers 
SET 
  payment_amount = 150.00
WHERE provider_type = 'certiport';

-- ============================================================================
-- ADD ONVUE REMOTE TESTING INFO
-- ============================================================================

UPDATE partner_lms_providers 
SET 
  enrollment_url = 'https://home.pearsonvue.com/certiport',
  sso_url = 'https://home.pearsonvue.com/certiport/onvue'
WHERE provider_type = 'certiport';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Certiport Pricing Updated!';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Pricing Tiers:';
  RAISE NOTICE '  - IC3 Digital Literacy: $79 per exam';
  RAISE NOTICE '  - Critical Career Skills: $85 per exam';
  RAISE NOTICE '  - Career Certifications: $90 per exam';
  RAISE NOTICE '  - PMI Project Management: $125';
  RAISE NOTICE '  - Microsoft/Adobe/IT: $150 per exam';
  RAISE NOTICE '';
  RAISE NOTICE '🏠 OnVUE Remote Testing Available';
  RAISE NOTICE '📍 Students can test from home or office';
  RAISE NOTICE '🎫 Vouchers can be purchased or used';
END $$;
