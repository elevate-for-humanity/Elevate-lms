-- ============================================================================
-- ADD CERTIPORT CERTIFICATIONS
-- All available Certiport certifications from their catalog
-- ============================================================================

-- Update Certiport provider
UPDATE partner_lms_providers 
SET 
  provider_name = 'Certiport - Microsoft & Adobe Certifications',
  enrollment_url = 'https://certiport.pearsonvue.com',
  requires_payment = true,
  payment_amount = 150.00
WHERE provider_type = 'certiport';

-- ============================================================================
-- INSERT ALL CERTIPORT CERTIFICATIONS
-- ============================================================================

-- Microsoft Office Specialist Certifications
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Microsoft Office Specialist Associate (Microsoft 365 Apps)',
  'MOS-365-ASSOCIATE',
  'Demonstrates competency in Microsoft Word, Excel, and PowerPoint (Microsoft 365 Apps)',
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
  'Microsoft Office Specialist Expert (Microsoft 365 Apps)',
  'MOS-365-EXPERT',
  'Advanced certification in Microsoft Word and Excel (Microsoft 365 Apps)',
  true,
  75,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('tax-prep-financial-services')
ON CONFLICT DO NOTHING;

INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Microsoft Office Specialist Master',
  'MOS-MASTER',
  'Master-level certification demonstrating expertise across all Microsoft Office applications',
  true,
  80,
  450.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('tax-prep-financial-services')
ON CONFLICT DO NOTHING;

-- IC3 Digital Literacy
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'IC3 Digital Literacy GS6 Master',
  'IC3-GS6-MASTER',
  'Validates digital literacy skills including computing fundamentals, key applications, and living online',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing', 'tax-prep-financial-services')
ON CONFLICT DO NOTHING;

-- Adobe Certifications
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Adobe Certified Professional in Visual Design',
  'ADOBE-VISUAL-DESIGN',
  'Demonstrates proficiency in Adobe Photoshop for visual design',
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
  'Adobe Certified Professional in Marketing Design',
  'ADOBE-MARKETING-DESIGN',
  'Demonstrates proficiency in Adobe InDesign for marketing materials',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- Workforce Ready Certification
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'Workforce Ready',
  'WORKFORCE-READY',
  'Validates essential workplace skills and professional readiness',
  true,
  70,
  100.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing', 'tax-prep-financial-services', 'barber', 'barber-apprenticeship-wrg')
ON CONFLICT DO NOTHING;

-- IT Certifications
INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
SELECT 
  p.id,
  'IT Technical Support Specialist',
  'IT-SUPPORT-SPECIALIST',
  'Validates skills for entry-level IT support roles',
  true,
  70,
  150.00,
  true,
  false
FROM programs p
WHERE p.slug IN ('business-startup-marketing')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE EMAIL TEMPLATE FOR CERTIPORT
-- ============================================================================

UPDATE email_templates
SET body_html_template = '<h1>Get Certified with Certiport!</h1>
<p>Hi {{student_name}},</p>
<p>You''re making excellent progress in {{program_name}}! It''s time to earn your industry-recognized certification through Certiport.</p>

<h3>Available Certifications:</h3>
<ul>
  <li>Microsoft Office Specialist (MOS)</li>
  <li>IC3 Digital Literacy</li>
  <li>Adobe Certified Professional</li>
  <li>Workforce Ready</li>
  <li>IT Technical Support Specialist</li>
</ul>

<h3>{{test_name}}</h3>
<p>{{test_description}}</p>

<p><strong>Step 1: Take the Free Pre-Test</strong></p>
<p>Before scheduling your official certification exam, take our free pre-test to ensure you''re ready:</p>
<p><a href="{{pretest_url}}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Take Pre-Test</a></p>

<p><strong>Passing Score:</strong> {{passing_score}}%</p>

<p><strong>Step 2: Schedule Your Official Test</strong></p>
<p>Once you pass the pre-test with {{passing_score}}% or higher, we''ll provide you with:</p>
<ul>
  <li>Certiport exam voucher (valued at ${{test_cost}})</li>
  <li>Testing center location and schedule</li>
  <li>Study materials and practice tests</li>
</ul>

<p><strong>Your certification will be:</strong></p>
<ul>
  <li>✅ Nationally recognized</li>
  <li>✅ Verified by Certiport/Pearson VUE</li>
  <li>✅ Shareable on LinkedIn and resumes</li>
  <li>✅ Valid for life (no expiration)</li>
</ul>

<p>Questions? Reply to this email or contact your instructor.</p>

<p>Let''s get you certified!</p>
<p>Elevate For Humanity Team</p>'
WHERE template_name = 'certiport_pretest_promotion';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Certiport Certifications Added!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Available Certifications:';
  RAISE NOTICE '  - Microsoft Office Specialist (Associate, Expert, Master)';
  RAISE NOTICE '  - IC3 Digital Literacy GS6 Master';
  RAISE NOTICE '  - Adobe Certified Professional (Visual, Marketing Design)';
  RAISE NOTICE '  - Workforce Ready';
  RAISE NOTICE '  - IT Technical Support Specialist';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Pricing: $100-$450 per certification';
  RAISE NOTICE '🎯 Pre-test required before official exam';
  RAISE NOTICE '🎫 Vouchers provided after passing pre-test';
END $$;
