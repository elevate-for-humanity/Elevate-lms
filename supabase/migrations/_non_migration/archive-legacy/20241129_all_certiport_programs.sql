-- ============================================================================
-- ALL CERTIPORT CERTIFICATION PROGRAMS
-- Based on Elizabeth Greene's Certiport account access
-- ============================================================================

-- Update Certiport provider with complete info
UPDATE partner_lms_providers 
SET 
  provider_name = 'Certiport - 15 Certification Programs',
  enrollment_url = 'https://certiport.pearsonvue.com',
  contact_name = 'Elizabeth Greene',
  contact_email = 'elizabethpowell6262@gmail.com',
  requires_payment = true,
  payment_amount = 150.00
WHERE provider_type = 'certiport';

-- ============================================================================
-- PROGRAM 1: IC3 DIGITAL LITERACY & ENTREPRENEURSHIP
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'IC3 Digital Literacy Certification',
  'IC3-DIGITAL-LITERACY',
  'Validates digital literacy skills including computing fundamentals, key applications, and living online',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing', 'tax-prep-financial-services', 'barber', 'barber-apprenticeship-wrg')
ON CONFLICT DO NOTHING;

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Entrepreneurship and Small Business Certification',
  'ESB-CERT',
  'Validates entrepreneurship knowledge and small business management skills',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 2: MICROSOFT OFFICE SPECIALIST
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Microsoft Office Specialist - Word',
  'MOS-WORD',
  'Demonstrates competency in Microsoft Word',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('tax-prep-financial-services', 'business-startup-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Microsoft Office Specialist - Excel',
  'MOS-EXCEL',
  'Demonstrates competency in Microsoft Excel',
  true,
  70,
  150.00,
  true,
  true
FROM programs p
WHERE p.slug IN ('tax-prep-financial-services')
ON CONFLICT DO NOTHING;

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Microsoft Office Specialist - PowerPoint',
  'MOS-POWERPOINT',
  'Demonstrates competency in Microsoft PowerPoint',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Microsoft Certified Fundamentals',
  'MS-FUNDAMENTALS',
  'Entry-level Microsoft certification demonstrating foundational knowledge',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('tax-prep-financial-services', 'business-startup-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Microsoft Certified Educator',
  'MCE',
  'Validates educators ability to use Microsoft tools for teaching and learning',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('beauty-career-educator')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 3: ADOBE CERTIFIED PROFESSIONAL
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Adobe Certified Professional - Photoshop',
  'ADOBE-PHOTOSHOP',
  'Demonstrates proficiency in Adobe Photoshop for visual design',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing', 'barber', 'barber-apprenticeship-wrg')
ON CONFLICT DO NOTHING;

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Adobe Certified Professional - Illustrator',
  'ADOBE-ILLUSTRATOR',
  'Demonstrates proficiency in Adobe Illustrator for graphic design',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Adobe Certified Professional - InDesign',
  'ADOBE-INDESIGN',
  'Demonstrates proficiency in Adobe InDesign for marketing materials',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 4: INTUIT CERTIFICATIONS
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Intuit QuickBooks Certified User',
  'QUICKBOOKS-CERT',
  'Validates proficiency in QuickBooks for bookkeeping and accounting',
  true,
  70,
  150.00,
  true,
  true
FROM programs p
WHERE p.slug IN ('tax-prep-financial-services')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 5: AUTODESK CERTIFIED USER
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Autodesk Certified User - AutoCAD',
  'AUTODESK-AUTOCAD',
  'Demonstrates proficiency in AutoCAD for design and drafting',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('hvac', 'hvac-technician', 'hvac-technician-wrg', 'building-maintenance', 'building-maintenance-wrg')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 6: APP DEVELOPMENT WITH SWIFT
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'App Development with Swift Certification',
  'SWIFT-CERT',
  'Validates skills in iOS app development using Swift programming language',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 7: UNITY CERTIFIED USER
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Unity Certified User',
  'UNITY-CERT',
  'Demonstrates proficiency in Unity for game development and interactive experiences',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 8: CRITICAL CAREER SKILLS
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Critical Career Skills Certification',
  'CAREER-SKILLS',
  'Validates essential workplace skills including communication, problem-solving, and professionalism',
  true,
  70,
  100.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing', 'barber', 'barber-apprenticeship-wrg', 'cna', 'cna-training-wrg')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 9: PROJECT MANAGEMENT INSTITUTE
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'PMI Project Management Ready',
  'PMI-READY',
  'Entry-level project management certification from PMI',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 10: INFORMATION TECHNOLOGY SPECIALIST
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Information Technology Specialist - Network Security',
  'ITS-NETWORK-SECURITY',
  'Validates foundational IT skills in network security',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 11: CISCO CERTIFIED SUPPORT TECHNICIAN
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Cisco Certified Support Technician',
  'CISCO-CCST',
  'Entry-level Cisco certification for network support technicians',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 12: META CERTIFICATION
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Meta Certified Digital Marketing Associate',
  'META-MARKETING',
  'Validates digital marketing skills using Meta (Facebook/Instagram) platforms',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 13: AGRISCIENCE AND TECHNOLOGY CAREERS
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Agriscience and Technology Certification',
  'AGRI-TECH',
  'Validates knowledge in agricultural science and technology applications',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 14: HEALTH SCIENCES CAREERS
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Health Sciences Career Certification',
  'HEALTH-SCIENCES',
  'Validates foundational knowledge for health sciences careers',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('cna', 'cna-training-wrg', 'medical-assistant', 'direct-support-professional')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROGRAM 15: HOSPITALITY AND CULINARY ARTS CAREERS
-- ============================================================================

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Hospitality and Culinary Arts Certification',
  'HOSPITALITY-CULINARY',
  'Validates foundational knowledge for hospitality and culinary careers',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('barber', 'barber-apprenticeship-wrg')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ALL 15 CERTIPORT PROGRAMS ADDED!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Certification Programs:';
  RAISE NOTICE '  1. IC3 Digital Literacy & Entrepreneurship';
  RAISE NOTICE '  2. Microsoft Office Specialist';
  RAISE NOTICE '  3. Adobe Certified Professional';
  RAISE NOTICE '  4. Intuit QuickBooks';
  RAISE NOTICE '  5. Autodesk Certified User';
  RAISE NOTICE '  6. App Development with Swift';
  RAISE NOTICE '  7. Unity Certified User';
  RAISE NOTICE '  8. Critical Career Skills';
  RAISE NOTICE '  9. Project Management Institute';
  RAISE NOTICE ' 10. Information Technology Specialist';
  RAISE NOTICE ' 11. Cisco Certified Support Technician';
  RAISE NOTICE ' 12. Meta Digital Marketing';
  RAISE NOTICE ' 13. Agriscience and Technology';
  RAISE NOTICE ' 14. Health Sciences Careers';
  RAISE NOTICE ' 15. Hospitality and Culinary Arts';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Total certifications mapped to programs: 30+';
  RAISE NOTICE '🎯 Pre-tests required before official exams';
  RAISE NOTICE '🎫 Vouchers provided after passing pre-test';
END $$;
