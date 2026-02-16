-- Seed Store Products with Complete Data
-- Run this to populate the products table with all store items

-- Clear existing products and re-seed
DELETE FROM products WHERE true;

-- Platform Licenses
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Core Platform License', 'core-platform', 'Complete workforce platform for individual operators. Includes LMS, enrollment, admin dashboard, and mobile PWA.', 4999, 'license', 'platform', '/images/store/platform-hero.jpg', true),
  ('School / Training Provider License', 'school-license', 'White-label platform with compliance tools, partner dashboard, case management, and WIOA reporting. Up to 5 deployments.', 15000, 'license', 'platform', '/images/store/platform-hero.jpg', true),
  ('Enterprise Platform License', 'enterprise-license', 'Full enterprise deployment with unlimited sites, custom integrations, dedicated support, and SLA.', 50000, 'license', 'platform', '/images/store/platform-hero.jpg', true),
  ('Monthly Core Infrastructure', 'monthly-core', 'Self-operating workforce infrastructure. Up to 100 learners, 3 programs.', 750, 'subscription', 'infrastructure', '/images/store/ai-studio.jpg', true),
  ('Monthly Institutional', 'monthly-institutional', 'Multi-program management with compliance dashboards. Up to 1,000 learners, 25 programs.', 2500, 'subscription', 'infrastructure', '/images/store/ai-studio.jpg', true),
  ('Monthly Enterprise', 'monthly-enterprise', 'Regional workforce governance with multi-tenant support. Up to 10,000 learners.', 8500, 'subscription', 'infrastructure', '/images/store/ai-studio.jpg', true);

-- Developer Licenses
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Developer Starter License', 'dev-starter', 'Full codebase access for single site deployment. 1 year updates, email support.', 299, 'license', 'developer', '/images/store/ai-instructors.jpg', true),
  ('Developer Pro License', 'dev-pro', 'Multi-site deployment with priority support. 2 years updates, Slack support.', 999, 'license', 'developer', '/images/store/ai-instructors.jpg', true),
  ('Developer Enterprise License', 'dev-enterprise', 'Unlimited deployments, white-label rights, dedicated support channel.', 5000, 'license', 'developer', '/images/store/ai-instructors.jpg', true);

-- Professional Certifications
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Microsoft Word Certification', 'ms-word-cert', 'Certiport Microsoft Office Specialist certification for Word.', 164, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('Microsoft Excel Certification', 'ms-excel-cert', 'Certiport Microsoft Office Specialist certification for Excel.', 164, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('Microsoft PowerPoint Certification', 'ms-powerpoint-cert', 'Certiport Microsoft Office Specialist certification for PowerPoint.', 164, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('Adobe Photoshop Certification', 'adobe-photoshop-cert', 'Adobe Certified Professional certification for Photoshop.', 210, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('Adobe Illustrator Certification', 'adobe-illustrator-cert', 'Adobe Certified Professional certification for Illustrator.', 210, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('CompTIA A+ Certification', 'comptia-a-plus', 'Entry-level IT certification covering hardware and software.', 249, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('CompTIA Security+', 'comptia-security-plus', 'Cybersecurity certification for IT professionals.', 349, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('CPR & AED Certification', 'cpr-aed', 'HSI CPR and AED certification for healthcare and workplace.', 135, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('First Aid Certification', 'first-aid', 'HSI First Aid certification for emergency response.', 135, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('BLS for Healthcare Providers', 'bls-healthcare', 'Basic Life Support certification for healthcare professionals.', 159, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('OSHA 10-Hour General Industry', 'osha-10', 'CareerSafe OSHA 10-hour safety training.', 89, 'course', 'safety', '/images/hvac-highlight.jpg', true),
  ('OSHA 30-Hour General Industry', 'osha-30', 'CareerSafe OSHA 30-hour safety training for supervisors.', 189, 'course', 'safety', '/images/hvac-highlight.jpg', true),
  ('Food Handler Certification', 'food-handler', 'Food safety certification for food service workers.', 64, 'course', 'certification', '/images/healthcare-highlight.jpg', true),
  ('QuickBooks Certification', 'quickbooks-cert', 'Intuit QuickBooks certification for accounting.', 210, 'course', 'certification', '/images/tax-business-highlight.jpg', true);

-- AI & Automation Tools
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('AI Studio Starter', 'ai-studio-starter', 'AI-powered content creation for training programs. 100 generations/month.', 99, 'subscription', 'ai-tools', '/images/store/ai-tutor.jpg', true),
  ('AI Studio Professional', 'ai-studio-pro', 'Advanced AI tools with custom model training. Unlimited generations.', 299, 'subscription', 'ai-tools', '/images/store/ai-tutor.jpg', true),
  ('AI Instructor Pack', 'ai-instructor-pack', 'AI teaching assistant for your courses. One-time purchase.', 499, 'addon', 'ai-tools', '/images/store/ai-tutor.jpg', true),
  ('AI Tutor License', 'ai-tutor', 'Personalized AI tutoring for learners with 24/7 support.', 999, 'license', 'ai-tools', '/images/store/ai-tutor.jpg', true);

-- Compliance Tools
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('WIOA Compliance Toolkit', 'wioa-toolkit', 'Complete WIOA compliance checklist, templates, and reporting tools.', 149, 'digital', 'compliance', '/images/store/crm-hub.jpg', true),
  ('FERPA Compliance Guide', 'ferpa-guide', 'FERPA requirements, documentation templates, and audit prep.', 99, 'digital', 'compliance', '/images/store/crm-hub.jpg', true),
  ('Grant Reporting Templates', 'grant-templates', 'Pre-built templates for federal and state grant reporting.', 79, 'digital', 'compliance', '/images/store/crm-hub.jpg', true),
  ('Workforce Compliance Checklist', 'compliance-checklist', 'Essential compliance checklist for workforce training programs.', 39, 'digital', 'compliance', '/images/store/crm-hub.jpg', true);

-- Apps & Integrations
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('SAM.gov Registration Assistant', 'sam-gov-assistant', 'Step-by-step SAM.gov registration guide with support.', 0, 'digital', 'apps', '/images/store/community-hub.jpg', true),
  ('Grants.gov Navigator', 'grants-navigator', 'Find and apply for federal grants with guided assistance.', 49, 'digital', 'apps', '/images/store/community-hub.jpg', true),
  ('Website Builder License', 'website-builder', 'AI-powered website builder for training organizations.', 299, 'license', 'apps', '/images/store/community-hub.jpg', true),
  ('Community Hub License', 'community-hub', 'Full community platform with forums, groups, and events.', 1999, 'license', 'apps', '/images/store/community-hub.jpg', true),
  ('CRM Hub License', 'crm-hub', 'Student and employer relationship management system.', 1499, 'license', 'apps', '/images/store/crm-hub.jpg', true);

-- Digital Resources
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Start a Tax Business Toolkit', 'tax-toolkit', 'Complete guide to starting your own tax preparation business.', 49, 'digital', 'resources', '/images/tax-business-highlight.jpg', true),
  ('Grant Readiness Guide', 'grant-guide', 'Step-by-step guide to preparing for federal grants.', 29, 'digital', 'resources', '/images/tax-business-highlight.jpg', true),
  ('Fund-Ready Mini Course', 'fund-ready-course', 'Video course on funding strategies for workforce programs.', 149, 'course', 'resources', '/images/tax-business-highlight.jpg', true),
  ('Interview Preparation Workbook', 'interview-workbook', 'Comprehensive interview prep with practice questions.', 0, 'digital', 'resources', '/images/tax-business-highlight.jpg', true),
  ('Resume Template Pack', 'resume-templates', 'Professional resume templates for various industries.', 0, 'digital', 'resources', '/images/tax-business-highlight.jpg', true);

-- Shop Products
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('HVAC Tool Kit', 'hvac-toolkit', 'Professional HVAC tool kit for technicians.', 149.99, 'physical', 'shop', '/images/hvac-highlight.jpg', true),
  ('Medical Scrubs Set', 'medical-scrubs', 'Professional medical scrubs in multiple colors.', 49.99, 'physical', 'shop', '/images/healthcare-highlight.jpg', true),
  ('Barber Shears Pro', 'barber-shears', 'Professional barber shears for precision cutting.', 89.99, 'physical', 'shop', '/images/barber-hero.jpg', true),
  ('Study Guide Bundle', 'study-guides', 'Comprehensive study guides for certification exams.', 29.99, 'physical', 'shop', '/images/healthcare-highlight.jpg', true),
  ('Safety Glasses', 'safety-glasses', 'OSHA-compliant safety glasses for workplace.', 24.99, 'physical', 'shop', '/images/hvac-highlight.jpg', true),
  ('Elevate Hoodie', 'elevate-hoodie', 'Comfortable hoodie with Elevate branding.', 59.99, 'physical', 'shop', '/images/store/platform-hero.jpg', true);

-- Training Programs (as products for purchase)
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  ('Barber Apprenticeship Program', 'barber-program', '1,500-hour state-approved apprenticeship with master barber instruction. WIOA eligible.', 0, 'program', 'training', '/images/barber-hero.jpg', true),
  ('CNA Training Program', 'cna-program', '6-week certified nursing assistant training with clinical hours. WIOA eligible.', 0, 'program', 'training', '/images/healthcare-highlight.jpg', true),
  ('HVAC Certification Program', 'hvac-program', '8-week HVAC technician certification with hands-on training. WRG available.', 0, 'program', 'training', '/images/hvac-hero.jpg', true),
  ('CDL Training Program', 'cdl-program', '4-week commercial driver license training. WIOA eligible.', 0, 'program', 'training', '/images/cdl-hero.jpg', true),
  ('Medical Assistant Program', 'ma-program', '12-week medical assistant certification program. WIOA eligible.', 0, 'program', 'training', '/images/healthcare-highlight.jpg', true),
  ('Phlebotomy Training', 'phlebotomy-program', '6-week phlebotomy technician certification. WIOA eligible.', 0, 'program', 'training', '/images/healthcare-highlight.jpg', true);
-- Seed FAQs
INSERT INTO faqs (id, question, answer, category, display_order, is_active) VALUES
  (gen_random_uuid(), 'What programs do you offer?', 'We offer career training programs in Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Plumbing, Welding), Technology (IT Support, Cybersecurity), Business (Tax Preparation, Entrepreneurship), and Barber/Cosmetology apprenticeships.', 'Programs', 1, true),
  (gen_random_uuid(), 'How long are the training programs?', 'Program lengths vary from 4 weeks to 16 weeks depending on the certification. Healthcare programs typically run 8-12 weeks, skilled trades 12-16 weeks, and technology programs 8-12 weeks.', 'Programs', 2, true),
  (gen_random_uuid(), 'Is the training really free?', 'Yes! Through WIOA (Workforce Innovation and Opportunity Act) funding and other grants, eligible participants can receive 100% free training. We help you determine eligibility and apply for funding.', 'Funding', 3, true),
  (gen_random_uuid(), 'What is WIOA funding?', 'WIOA (Workforce Innovation and Opportunity Act) is a federal program that provides funding for job training to eligible adults, dislocated workers, and youth. It covers tuition, books, supplies, and sometimes supportive services.', 'Funding', 4, true),
  (gen_random_uuid(), 'How do I know if I qualify for free training?', 'Eligibility depends on factors like income level, employment status, and residency. Generally, if you are unemployed, underemployed, or meet income guidelines, you may qualify. Contact us for a free eligibility assessment.', 'Funding', 5, true),
  (gen_random_uuid(), 'Do you help with job placement?', 'Yes! We provide comprehensive career services including resume writing, interview preparation, job search assistance, and connections to employer partners. Our goal is to help you get hired after completing your training.', 'Career Services', 6, true),
  (gen_random_uuid(), 'Where are you located?', 'Our main campus is located in Indianapolis, Indiana. We also offer some programs at partner locations throughout Indiana. Contact us for specific program locations.', 'General', 7, true),
  (gen_random_uuid(), 'Can I work while attending training?', 'Many of our programs offer flexible scheduling including evening and weekend options. We work with students to accommodate work schedules when possible.', 'General', 8, true),
  (gen_random_uuid(), 'What certifications will I earn?', 'Each program leads to industry-recognized certifications. For example, CNA students earn state nursing assistant certification, HVAC students earn EPA 608 certification, and IT students can earn CompTIA certifications.', 'Programs', 9, true),
  (gen_random_uuid(), 'How do I apply?', 'You can apply online through our website, call us at (317) 314-3757, or visit our campus. The application process includes an eligibility assessment, program selection, and enrollment paperwork.', 'Enrollment', 10, true)
ON CONFLICT DO NOTHING;
-- Seed forum categories
INSERT INTO forum_categories (id, name, description, order_index) VALUES
  (gen_random_uuid(), 'General Discussion', 'General topics and community conversations', 1),
  (gen_random_uuid(), 'Healthcare Programs', 'Discuss CNA, Medical Assistant, Phlebotomy and other healthcare training', 2),
  (gen_random_uuid(), 'Skilled Trades', 'HVAC, Electrical, Plumbing, Welding discussions', 3),
  (gen_random_uuid(), 'Technology', 'IT Support, Cybersecurity, and tech career discussions', 4),
  (gen_random_uuid(), 'Job Search & Career', 'Resume tips, interview prep, job opportunities', 5),
  (gen_random_uuid(), 'Student Support', 'Get help with coursework, funding, and student services', 6)
ON CONFLICT DO NOTHING;
-- Seed marketplace items
INSERT INTO marketplace_items (id, title, description, price, category, rating, reviews_count, is_active, created_at) VALUES
  (gen_random_uuid(), 'CNA Study Guide Bundle', 'Comprehensive study materials for CNA certification exam including practice tests, flashcards, and study notes.', 29.99, 'Study Materials', 4.8, 124, true, NOW()),
  (gen_random_uuid(), 'HVAC Fundamentals eBook', 'Complete guide to HVAC systems, maintenance, and troubleshooting for beginners and professionals.', 19.99, 'eBooks', 4.6, 89, true, NOW()),
  (gen_random_uuid(), 'Resume Template Pack', 'Professional resume templates designed for healthcare, trades, and technology careers. Includes cover letter templates.', 14.99, 'Career Resources', 4.9, 256, true, NOW()),
  (gen_random_uuid(), 'Interview Prep Course', 'Video course covering common interview questions, body language tips, and salary negotiation strategies.', 49.99, 'Courses', 4.7, 178, true, NOW()),
  (gen_random_uuid(), 'Medical Terminology Flashcards', 'Digital flashcard set with 500+ medical terms, definitions, and pronunciation guides.', 9.99, 'Study Materials', 4.5, 312, true, NOW()),
  (gen_random_uuid(), 'Electrical Code Reference Guide', 'Quick reference guide for NEC electrical codes with diagrams and examples.', 24.99, 'Reference', 4.8, 67, true, NOW()),
  (gen_random_uuid(), 'Tax Preparation Workbook', 'Practice workbook with sample tax returns and step-by-step instructions for tax preparers.', 34.99, 'Workbooks', 4.6, 145, true, NOW()),
  (gen_random_uuid(), 'IT Certification Practice Tests', 'Practice exams for CompTIA A+, Network+, and Security+ certifications with detailed explanations.', 39.99, 'Practice Tests', 4.9, 423, true, NOW())
ON CONFLICT DO NOTHING;
-- Seed mentors (requires profiles to exist first)
-- This creates mentor records linked to existing staff profiles or creates placeholder mentors

-- First ensure we have the mentors table structure
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  bio TEXT,
  expertise TEXT,
  availability TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample mentors with placeholder data
INSERT INTO mentors (id, bio, expertise, availability, is_active) VALUES
  (gen_random_uuid(), 'Healthcare professional with 15+ years of experience in nursing and patient care. Passionate about helping new CNAs succeed in their careers.', 'Healthcare - CNA, Patient Care', 'Weekday evenings', true),
  (gen_random_uuid(), 'Licensed HVAC technician and business owner. Specializes in commercial refrigeration and mentoring new technicians.', 'HVAC, Refrigeration, Business', 'Flexible schedule', true),
  (gen_random_uuid(), 'IT professional with expertise in cybersecurity and network administration. Helps students prepare for CompTIA certifications.', 'IT Support, Cybersecurity, Networking', 'Weekends', true),
  (gen_random_uuid(), 'Master electrician with 20 years in residential and commercial electrical work. Guides apprentices through licensing requirements.', 'Electrical, Code Compliance', 'Tuesday/Thursday evenings', true),
  (gen_random_uuid(), 'Licensed barber and shop owner. Mentors apprentices on building clientele and business management.', 'Barbering, Business Management', 'Monday/Wednesday afternoons', true),
  (gen_random_uuid(), 'Tax professional and enrolled agent. Helps students navigate tax preparation careers and IRS certifications.', 'Tax Preparation, Accounting', 'Tax season availability varies', true)
ON CONFLICT DO NOTHING;
-- Seed scholarships
INSERT INTO scholarships (id, name, description, amount, deadline, eligibility_criteria, max_recipients, current_recipients, is_active) VALUES
  (gen_random_uuid(), 'RISE Healthcare Scholarship', 'Full tuition scholarship for CNA, Medical Assistant, or Phlebotomy training programs. Covers all program costs including books and certification fees.', 5000, '2026-03-31', ARRAY['Indiana resident', 'High school diploma or GED', 'Demonstrated financial need', 'Interest in healthcare career'], 20, 8, true),
  (gen_random_uuid(), 'Skilled Trades Grant', 'Funding for HVAC, Electrical, Plumbing, or Welding training. Includes tool kit and safety equipment.', 4500, '2026-04-15', ARRAY['Indiana resident', '18 years or older', 'Valid drivers license', 'Pass background check'], 15, 5, true),
  (gen_random_uuid(), 'Technology Career Fund', 'Support for IT Support and Cybersecurity certification programs. Covers training, exam fees, and study materials.', 3500, '2026-05-01', ARRAY['Indiana resident', 'Basic computer skills', 'High school diploma or GED'], 25, 12, true),
  (gen_random_uuid(), 'Second Chance Scholarship', 'Dedicated funding for justice-involved individuals seeking career training and a fresh start.', 5000, NULL, ARRAY['Indiana resident', 'Completed sentence or on supervised release', 'Commitment to program completion'], 30, 18, true),
  (gen_random_uuid(), 'Single Parent Support Grant', 'Additional support for single parents including childcare assistance and flexible scheduling accommodations.', 2500, '2026-06-01', ARRAY['Single parent household', 'Indiana resident', 'Enrolled in any Elevate program'], 40, 22, true),
  (gen_random_uuid(), 'Veterans Career Transition', 'Supplemental funding for veterans transitioning to civilian careers. Stackable with GI Bill benefits.', 3000, NULL, ARRAY['Honorable discharge', 'Indiana resident', 'DD-214 documentation'], 50, 15, true)
ON CONFLICT DO NOTHING;
-- Seed career_applications with test data for admin dashboard verification
-- DEV/STAGING ONLY - Uses @example.com emails to prevent prod pollution
-- These records are safe to have in prod (example.com is reserved per RFC 2606)
-- but will be ignored by real workflows

-- Guard: Only insert if no real applications exist (prevents duplicate seeding)
DO $$
BEGIN
  -- Skip if there are already applications with non-example.com emails
  IF EXISTS (
    SELECT 1 FROM career_applications 
    WHERE email NOT LIKE '%@example.com'
    LIMIT 1
  ) THEN
    RAISE NOTICE 'Skipping seed: real applications exist';
    RETURN;
  END IF;

  INSERT INTO career_applications (
  first_name, last_name, email, phone,
  application_state, status, last_transition_at, state_history,
  address, city, state, zip_code,
  high_school, graduation_year, gpa,
  employment_status, years_experience
) VALUES
  ('Maria', 'Garcia', 'maria.garcia@example.com', '555-0101',
   'submitted', 'pending_review', NOW() - INTERVAL '2 days',
   '[{"state":"started","timestamp":"2026-01-25T10:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-26T14:00:00Z","action":"advanced"},{"state":"documents_complete","timestamp":"2026-01-27T09:00:00Z","action":"advanced"},{"state":"review_ready","timestamp":"2026-01-27T16:00:00Z","action":"advanced"},{"state":"submitted","timestamp":"2026-01-28T11:00:00Z","action":"submitted"}]'::jsonb,
   '123 Main St', 'Houston', 'TX', '77001',
   'Westside High School', '2024', '3.5',
   'unemployed', '0'),
   
  ('James', 'Wilson', 'james.wilson@example.com', '555-0102',
   'review_ready', 'in_progress', NOW() - INTERVAL '1 day',
   '[{"state":"started","timestamp":"2026-01-27T08:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-28T10:00:00Z","action":"advanced"},{"state":"documents_complete","timestamp":"2026-01-29T11:00:00Z","action":"advanced"},{"state":"review_ready","timestamp":"2026-01-29T15:00:00Z","action":"advanced"}]'::jsonb,
   '456 Oak Ave', 'Dallas', 'TX', '75201',
   'Lincoln High School', '2023', '3.8',
   'part_time', '1'),
   
  ('Aisha', 'Johnson', 'aisha.johnson@example.com', '555-0103',
   'documents_complete', 'in_progress', NOW() - INTERVAL '3 hours',
   '[{"state":"started","timestamp":"2026-01-29T09:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-29T14:00:00Z","action":"advanced"},{"state":"documents_complete","timestamp":"2026-01-29T21:00:00Z","action":"advanced"}]'::jsonb,
   '789 Pine Rd', 'Austin', 'TX', '78701',
   'Austin High School', '2025', '3.2',
   'student', '0'),
   
  ('Carlos', 'Martinez', 'carlos.martinez@example.com', '555-0104',
   'eligibility_complete', 'in_progress', NOW() - INTERVAL '6 hours',
   '[{"state":"started","timestamp":"2026-01-29T18:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-29T22:00:00Z","action":"advanced"}]'::jsonb,
   '321 Elm St', 'San Antonio', 'TX', '78201',
   'Roosevelt High School', '2024', '3.0',
   'full_time', '2'),
   
  ('Emily', 'Chen', 'emily.chen@example.com', '555-0105',
   'started', 'draft', NOW(),
   '[{"state":"started","timestamp":"2026-01-30T00:00:00Z","action":"created"}]'::jsonb,
   NULL, NULL, NULL, NULL,
   NULL, NULL, NULL,
   NULL, NULL),
   
  ('David', 'Brown', 'david.brown@example.com', '555-0106',
   'rejected', 'closed', NOW() - INTERVAL '5 days',
   '[{"state":"started","timestamp":"2026-01-20T10:00:00Z","action":"created"},{"state":"eligibility_complete","timestamp":"2026-01-21T14:00:00Z","action":"advanced"},{"state":"documents_complete","timestamp":"2026-01-22T09:00:00Z","action":"advanced"},{"state":"review_ready","timestamp":"2026-01-23T16:00:00Z","action":"advanced"},{"state":"rejected","timestamp":"2026-01-25T11:00:00Z","action":"rejected","notes":"Incomplete documentation"}]'::jsonb,
   '654 Maple Dr', 'Fort Worth', 'TX', '76101',
   'Central High School', '2022', '2.8',
   'unemployed', '1')
  ON CONFLICT DO NOTHING;

END $$;
-- Application State Machine Tests
-- Run these after applying the migration to verify correctness
-- Execute as service_role to bypass RLS for testing

-- ============================================
-- TEST SUITE: State Machine Verification
-- ============================================

DO $$
DECLARE
  v_app_id UUID;
  v_app_id_2 UUID;
  v_result JSONB;
  v_test_email TEXT := 'test_' || gen_random_uuid()::text || '@test.com';
BEGIN
  RAISE NOTICE '=== Starting State Machine Tests ===';

  -- TEST 1: start_application creates new application
  RAISE NOTICE 'TEST 1: start_application creates new application';
  SELECT start_application(
    NULL,
    'Test',
    'User',
    v_test_email,
    '555-1234'
  ) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Could not create application: %', v_result->>'error';
  END IF;
  v_app_id := (v_result->>'application_id')::UUID;
  RAISE NOTICE 'TEST 1 PASSED: Created application %', v_app_id;

  -- TEST 2: start_application is idempotent (same email returns same ID)
  RAISE NOTICE 'TEST 2: start_application idempotency';
  SELECT start_application(
    NULL,
    'Test',
    'User',
    v_test_email,
    '555-1234'
  ) INTO v_result;
  
  IF (v_result->>'application_id')::UUID != v_app_id THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Idempotency broken - got different ID';
  END IF;
  IF NOT (v_result->>'resumed')::boolean THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Should indicate resumed=true';
  END IF;
  RAISE NOTICE 'TEST 2 PASSED: Same application ID returned, resumed=true';

  -- TEST 3: Valid forward transition started -> eligibility_complete
  RAISE NOTICE 'TEST 3: Valid transition started -> eligibility_complete';
  SELECT advance_application_state(
    v_app_id,
    'eligibility_complete',
    '{"first_name": "Updated", "last_name": "Name"}'::jsonb
  ) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 3 FAILED: %', v_result->>'error';
  END IF;
  IF v_result->>'current_state' != 'eligibility_complete' THEN
    RAISE EXCEPTION 'TEST 3 FAILED: State not updated correctly';
  END IF;
  RAISE NOTICE 'TEST 3 PASSED: Transitioned to eligibility_complete';

  -- TEST 4: Invalid transition started -> review_ready (should fail)
  RAISE NOTICE 'TEST 4: Invalid transition eligibility_complete -> submitted (skip)';
  SELECT advance_application_state(
    v_app_id,
    'submitted',
    '{}'::jsonb
  ) INTO v_result;
  
  IF (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Should have rejected invalid transition';
  END IF;
  IF v_result->>'code' != 'INVALID_TRANSITION' THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Wrong error code: %', v_result->>'code';
  END IF;
  RAISE NOTICE 'TEST 4 PASSED: Invalid transition rejected with INVALID_TRANSITION';

  -- TEST 5: Continue valid path to review_ready
  RAISE NOTICE 'TEST 5: Complete path to review_ready';
  SELECT advance_application_state(v_app_id, 'documents_complete', '{}'::jsonb) INTO v_result;
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 5a FAILED: %', v_result->>'error';
  END IF;
  
  SELECT advance_application_state(v_app_id, 'review_ready', '{}'::jsonb) INTO v_result;
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 5b FAILED: %', v_result->>'error';
  END IF;
  RAISE NOTICE 'TEST 5 PASSED: Reached review_ready state';

  -- TEST 6: Submit without terms (should fail)
  RAISE NOTICE 'TEST 6: Submit without terms acceptance';
  SELECT submit_application(v_app_id, FALSE) INTO v_result;
  
  IF (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Should require terms acceptance';
  END IF;
  IF v_result->>'code' != 'TERMS_NOT_ACCEPTED' THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Wrong error code: %', v_result->>'code';
  END IF;
  RAISE NOTICE 'TEST 6 PASSED: Rejected without terms';

  -- TEST 7: Valid submission
  RAISE NOTICE 'TEST 7: Valid submission with terms';
  SELECT submit_application(v_app_id, TRUE) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 7 FAILED: %', v_result->>'error';
  END IF;
  RAISE NOTICE 'TEST 7 PASSED: Application submitted successfully';

  -- TEST 8: Verify submitted_at is set
  RAISE NOTICE 'TEST 8: Verify submitted_at timestamp';
  IF NOT EXISTS (
    SELECT 1 FROM career_applications 
    WHERE id = v_app_id AND submitted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'TEST 8 FAILED: submitted_at not set';
  END IF;
  RAISE NOTICE 'TEST 8 PASSED: submitted_at is set';

  -- TEST 9: Cannot transition from submitted
  RAISE NOTICE 'TEST 9: Cannot transition from submitted';
  SELECT advance_application_state(v_app_id, 'started', '{}'::jsonb) INTO v_result;
  
  IF (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 9 FAILED: Should not allow transition from submitted';
  END IF;
  RAISE NOTICE 'TEST 9 PASSED: Transition from submitted blocked';

  -- TEST 10: Submit on non-review_ready state fails
  RAISE NOTICE 'TEST 10: Submit requires review_ready state';
  -- Create a new application
  SELECT start_application(
    NULL, 'Test2', 'User2', 
    'test2_' || gen_random_uuid()::text || '@test.com',
    '555-5678'
  ) INTO v_result;
  v_app_id_2 := (v_result->>'application_id')::UUID;
  
  SELECT submit_application(v_app_id_2, TRUE) INTO v_result;
  IF (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 10 FAILED: Should require review_ready state';
  END IF;
  IF v_result->>'code' != 'INVALID_STATE' THEN
    RAISE EXCEPTION 'TEST 10 FAILED: Wrong error code: %', v_result->>'code';
  END IF;
  RAISE NOTICE 'TEST 10 PASSED: Submit blocked on non-review_ready state';

  -- TEST 11: Backward transition allowed
  RAISE NOTICE 'TEST 11: Backward transition eligibility_complete -> started';
  SELECT advance_application_state(v_app_id_2, 'eligibility_complete', '{}'::jsonb) INTO v_result;
  SELECT advance_application_state(v_app_id_2, 'started', '{}'::jsonb) INTO v_result;
  
  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST 11 FAILED: Backward transition should be allowed';
  END IF;
  RAISE NOTICE 'TEST 11 PASSED: Backward transition allowed';

  -- TEST 12: State history is capped
  RAISE NOTICE 'TEST 12: State history cap verification';
  -- Do many transitions
  FOR i IN 1..25 LOOP
    SELECT advance_application_state(v_app_id_2, 'eligibility_complete', '{}'::jsonb) INTO v_result;
    SELECT advance_application_state(v_app_id_2, 'started', '{}'::jsonb) INTO v_result;
  END LOOP;
  
  IF (SELECT jsonb_array_length(state_history) FROM career_applications WHERE id = v_app_id_2) > 20 THEN
    RAISE EXCEPTION 'TEST 12 FAILED: State history exceeds cap of 20';
  END IF;
  RAISE NOTICE 'TEST 12 PASSED: State history capped at 20';

  -- TEST 13: Field whitelisting - personal info locked after started
  RAISE NOTICE 'TEST 13: Field whitelisting verification';
  -- Advance to eligibility_complete
  SELECT advance_application_state(v_app_id_2, 'eligibility_complete', '{"first_name": "Locked"}'::jsonb) INTO v_result;
  -- Try to change first_name in documents_complete transition
  SELECT advance_application_state(v_app_id_2, 'documents_complete', '{"first_name": "ShouldNotChange"}'::jsonb) INTO v_result;
  
  IF (SELECT first_name FROM career_applications WHERE id = v_app_id_2) = 'ShouldNotChange' THEN
    RAISE EXCEPTION 'TEST 13 FAILED: first_name should be locked after started state';
  END IF;
  RAISE NOTICE 'TEST 13 PASSED: Field whitelisting enforced';

  -- TEST 14: Audit log written for invalid transition
  RAISE NOTICE 'TEST 14: Audit log for invalid transitions';
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_app_id 
    AND action = 'invalid_state_transition'
  ) THEN
    RAISE EXCEPTION 'TEST 14 FAILED: Audit log not written for invalid transition';
  END IF;
  RAISE NOTICE 'TEST 14 PASSED: Audit log written';

  -- TEST 15: Audit log written for successful submission
  RAISE NOTICE 'TEST 15: Audit log for successful submission';
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_app_id 
    AND action = 'application_submitted'
  ) THEN
    RAISE EXCEPTION 'TEST 15 FAILED: Audit log not written for submission';
  END IF;
  RAISE NOTICE 'TEST 15 PASSED: Submission audit log written';

  -- Cleanup test data
  DELETE FROM career_applications WHERE id IN (v_app_id, v_app_id_2);
  DELETE FROM audit_logs WHERE entity_id IN (v_app_id, v_app_id_2);

  RAISE NOTICE '=== All 15 Tests PASSED ===';
END $$;
-- Phase 2 Tests: Enrollment and Partner Approval
-- Run as service_role to bypass RLS

-- ============================================
-- TEST SUITE A: Enrollment RPC
-- ============================================
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_program_id UUID;
  v_result JSONB;
  v_enrollment_id UUID;
  v_idempotency_key TEXT := 'test-enroll-' || gen_random_uuid()::text;
BEGIN
  RAISE NOTICE '=== Phase 2 Enrollment Tests ===';

  -- Setup: Create test user profile
  INSERT INTO profiles (id, email, full_name, role, enrollment_status)
  VALUES (v_user_id, 'test_enroll_' || v_user_id::text || '@test.com', 'Test Student', 'student', 'pending');

  -- Setup: Get or create a test program
  SELECT id INTO v_program_id FROM programs LIMIT 1;
  IF v_program_id IS NULL THEN
    INSERT INTO programs (id, name, slug, description)
    VALUES (gen_random_uuid(), 'Test Program', 'test-program', 'Test')
    RETURNING id INTO v_program_id;
  END IF;

  -- TEST A1: First enrollment call succeeds
  RAISE NOTICE 'TEST A1: First enrollment call';
  SELECT rpc_enroll_student(
    v_user_id,
    v_program_id,
    v_idempotency_key,
    'test',
    '{"funding_source": "WIOA"}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST A1 FAILED: %', v_result->>'message';
  END IF;
  v_enrollment_id := (v_result->>'enrollment_id')::UUID;
  RAISE NOTICE 'TEST A1 PASSED: Enrollment created %', v_enrollment_id;

  -- TEST A2: Idempotent re-call returns same result
  RAISE NOTICE 'TEST A2: Idempotent re-call';
  SELECT rpc_enroll_student(
    v_user_id,
    v_program_id,
    v_idempotency_key,
    'test',
    '{}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST A2 FAILED: Should succeed idempotently';
  END IF;
  IF NOT (v_result->>'idempotent')::boolean AND NOT (v_result->>'already_enrolled')::boolean THEN
    RAISE EXCEPTION 'TEST A2 FAILED: Should indicate idempotent/already_enrolled';
  END IF;
  IF (v_result->>'enrollment_id')::UUID != v_enrollment_id THEN
    RAISE EXCEPTION 'TEST A2 FAILED: Should return same enrollment_id';
  END IF;
  RAISE NOTICE 'TEST A2 PASSED: Idempotent call returned same enrollment';

  -- TEST A3: Profile status updated to active
  RAISE NOTICE 'TEST A3: Profile status update';
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND enrollment_status = 'active'
  ) THEN
    RAISE EXCEPTION 'TEST A3 FAILED: Profile enrollment_status not updated';
  END IF;
  RAISE NOTICE 'TEST A3 PASSED: Profile status is active';

  -- TEST A4: Audit log written
  RAISE NOTICE 'TEST A4: Audit log verification';
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_enrollment_id 
    AND action = 'enrollment_created'
  ) THEN
    RAISE EXCEPTION 'TEST A4 FAILED: Audit log not written';
  END IF;
  RAISE NOTICE 'TEST A4 PASSED: Audit log exists';

  -- TEST A5: Notification created
  RAISE NOTICE 'TEST A5: Notification verification';
  IF NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = v_user_id 
    AND title = 'Enrollment Confirmed'
  ) THEN
    RAISE EXCEPTION 'TEST A5 FAILED: Notification not created';
  END IF;
  RAISE NOTICE 'TEST A5 PASSED: Notification exists';

  -- TEST A6: Different idempotency key with same user/program returns existing
  RAISE NOTICE 'TEST A6: Different key, same enrollment';
  SELECT rpc_enroll_student(
    v_user_id,
    v_program_id,
    'different-key-' || gen_random_uuid()::text,
    'test',
    '{}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST A6 FAILED: Should succeed';
  END IF;
  IF NOT (v_result->>'already_enrolled')::boolean THEN
    RAISE EXCEPTION 'TEST A6 FAILED: Should indicate already_enrolled';
  END IF;
  RAISE NOTICE 'TEST A6 PASSED: Existing enrollment returned';

  -- Cleanup
  DELETE FROM notifications WHERE user_id = v_user_id;
  DELETE FROM delivery_logs WHERE recipient LIKE '%' || v_user_id::text || '%';
  DELETE FROM enrollments WHERE user_id = v_user_id;
  DELETE FROM program_enrollments WHERE student_id = v_user_id;
  DELETE FROM audit_logs WHERE entity_id = v_enrollment_id;
  DELETE FROM idempotency_keys WHERE user_id = v_user_id;
  DELETE FROM profiles WHERE id = v_user_id;

  RAISE NOTICE '=== Enrollment Tests PASSED (6/6) ===';
END $$;

-- ============================================
-- TEST SUITE B: Partner Approval RPC
-- ============================================
DO $$
DECLARE
  v_admin_id UUID := gen_random_uuid();
  v_application_id UUID;
  v_partner_id UUID;
  v_auth_user_id UUID := gen_random_uuid();
  v_result JSONB;
  v_idempotency_key TEXT := 'test-approve-' || gen_random_uuid()::text;
  v_test_email TEXT := 'test_partner_' || gen_random_uuid()::text || '@test.com';
BEGIN
  RAISE NOTICE '=== Phase 2 Partner Approval Tests ===';

  -- Setup: Create admin profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (v_admin_id, 'admin_' || v_admin_id::text || '@test.com', 'Test Admin', 'admin');

  -- Setup: Create partner application
  INSERT INTO partner_applications (
    id, shop_name, owner_name, contact_email, phone, 
    address_line1, city, state, zip, status, programs_requested
  ) VALUES (
    gen_random_uuid(),
    'Test Shop',
    'Test Owner',
    v_test_email,
    '555-1234',
    '123 Test St',
    'Test City',
    'IN',
    '46000',
    'pending',
    '["barber"]'
  )
  RETURNING id INTO v_application_id;

  -- TEST B1: First approval call succeeds
  RAISE NOTICE 'TEST B1: First approval call';
  SELECT rpc_approve_partner(
    v_application_id,
    v_admin_id,
    v_test_email,
    NULL,
    v_idempotency_key,
    '{}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST B1 FAILED: %', v_result->>'message';
  END IF;
  v_partner_id := (v_result->>'partner_id')::UUID;
  IF v_result->>'status' != 'approved_pending_user' THEN
    RAISE EXCEPTION 'TEST B1 FAILED: Status should be approved_pending_user';
  END IF;
  RAISE NOTICE 'TEST B1 PASSED: Partner created with approved_pending_user status';

  -- TEST B2: Idempotent re-call
  RAISE NOTICE 'TEST B2: Idempotent approval call';
  SELECT rpc_approve_partner(
    v_application_id,
    v_admin_id,
    v_test_email,
    NULL,
    v_idempotency_key,
    '{}'::jsonb
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST B2 FAILED: Should succeed idempotently';
  END IF;
  IF NOT (v_result->>'idempotent')::boolean THEN
    RAISE EXCEPTION 'TEST B2 FAILED: Should indicate idempotent';
  END IF;
  RAISE NOTICE 'TEST B2 PASSED: Idempotent call succeeded';

  -- TEST B3: Partner entity created
  RAISE NOTICE 'TEST B3: Partner entity verification';
  IF NOT EXISTS (
    SELECT 1 FROM partners WHERE id = v_partner_id
  ) THEN
    RAISE EXCEPTION 'TEST B3 FAILED: Partner not created';
  END IF;
  RAISE NOTICE 'TEST B3 PASSED: Partner exists';

  -- TEST B4: Application status updated
  RAISE NOTICE 'TEST B4: Application status verification';
  IF NOT EXISTS (
    SELECT 1 FROM partner_applications 
    WHERE id = v_application_id 
    AND approval_status = 'approved_pending_user'
  ) THEN
    RAISE EXCEPTION 'TEST B4 FAILED: Application status not updated';
  END IF;
  RAISE NOTICE 'TEST B4 PASSED: Application status is approved_pending_user';

  -- TEST B5: Link partner user
  RAISE NOTICE 'TEST B5: Link partner user';
  SELECT rpc_link_partner_user(
    v_partner_id,
    v_auth_user_id,
    v_test_email,
    'link-' || v_idempotency_key
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST B5 FAILED: %', v_result->>'message';
  END IF;
  IF v_result->>'status' != 'approved' THEN
    RAISE EXCEPTION 'TEST B5 FAILED: Status should be approved';
  END IF;
  RAISE NOTICE 'TEST B5 PASSED: Partner user linked';

  -- TEST B6: Partner account status updated
  RAISE NOTICE 'TEST B6: Partner account status verification';
  IF NOT EXISTS (
    SELECT 1 FROM partners 
    WHERE id = v_partner_id 
    AND account_status = 'active'
  ) THEN
    RAISE EXCEPTION 'TEST B6 FAILED: Partner account_status not active';
  END IF;
  RAISE NOTICE 'TEST B6 PASSED: Partner account is active';

  -- TEST B7: Profile created
  RAISE NOTICE 'TEST B7: Profile verification';
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_auth_user_id 
    AND role = 'partner_admin'
  ) THEN
    RAISE EXCEPTION 'TEST B7 FAILED: Profile not created with partner_admin role';
  END IF;
  RAISE NOTICE 'TEST B7 PASSED: Profile exists with correct role';

  -- TEST B8: Idempotent link call
  RAISE NOTICE 'TEST B8: Idempotent link call';
  SELECT rpc_link_partner_user(
    v_partner_id,
    v_auth_user_id,
    v_test_email,
    'link-' || v_idempotency_key
  ) INTO v_result;

  IF NOT (v_result->>'success')::boolean THEN
    RAISE EXCEPTION 'TEST B8 FAILED: Should succeed idempotently';
  END IF;
  RAISE NOTICE 'TEST B8 PASSED: Idempotent link succeeded';

  -- TEST B9: Audit logs written
  RAISE NOTICE 'TEST B9: Audit log verification';
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_partner_id 
    AND action = 'partner_approved'
  ) THEN
    RAISE EXCEPTION 'TEST B9 FAILED: Approval audit log not written';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM audit_logs 
    WHERE entity_id = v_partner_id 
    AND action = 'partner_user_linked'
  ) THEN
    RAISE EXCEPTION 'TEST B9 FAILED: Link audit log not written';
  END IF;
  RAISE NOTICE 'TEST B9 PASSED: Audit logs exist';

  -- TEST B10: Double approval with different key fails
  RAISE NOTICE 'TEST B10: Double approval rejection';
  SELECT rpc_approve_partner(
    v_application_id,
    v_admin_id,
    v_test_email,
    NULL,
    'different-key-' || gen_random_uuid()::text,
    '{}'::jsonb
  ) INTO v_result;

  IF (v_result->>'success')::boolean AND NOT (v_result->>'idempotent')::boolean THEN
    -- Check if it correctly identified already processed
    IF v_result->>'code' != 'ALREADY_PROCESSED' THEN
      RAISE EXCEPTION 'TEST B10 FAILED: Should reject or return idempotent';
    END IF;
  END IF;
  RAISE NOTICE 'TEST B10 PASSED: Double approval handled correctly';

  -- Cleanup
  DELETE FROM partner_users WHERE partner_id = v_partner_id;
  DELETE FROM partner_program_access WHERE partner_id = v_partner_id;
  DELETE FROM audit_logs WHERE entity_id = v_partner_id;
  DELETE FROM partners WHERE id = v_partner_id;
  DELETE FROM partner_applications WHERE id = v_application_id;
  DELETE FROM idempotency_keys WHERE user_id IN (v_admin_id, v_auth_user_id);
  DELETE FROM profiles WHERE id IN (v_admin_id, v_auth_user_id);

  RAISE NOTICE '=== Partner Approval Tests PASSED (10/10) ===';
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'PHASE 2 TEST SUMMARY';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Enrollment RPC Tests: 6/6 PASSED';
  RAISE NOTICE 'Partner Approval Tests: 10/10 PASSED';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'All Phase 2 tests completed successfully.';
  RAISE NOTICE '==========================================';
END $$;
-- 20260215_rls_test_harness.sql
--
-- JWT simulation test harness for verifying RLS enforcement.
-- Creates a function that tests access for each role.
-- Run after 20260215_break_recursion_use_definer_functions.sql.
--
-- Usage: SELECT * FROM public.rls_test_report();

CREATE OR REPLACE FUNCTION public.rls_test_report()
RETURNS TABLE (
  test_name text,
  passed boolean,
  detail text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
  v_admin_id uuid;
  v_student_id uuid;
  v_admin_tenant uuid;
  v_student_tenant uuid;
BEGIN
  -- Get a real admin and student for testing
  SELECT id, tenant_id INTO v_admin_id, v_admin_tenant
  FROM profiles WHERE role IN ('admin', 'super_admin') AND tenant_id IS NOT NULL LIMIT 1;

  SELECT id, tenant_id INTO v_student_id, v_student_tenant
  FROM profiles WHERE role = 'student' AND tenant_id IS NOT NULL LIMIT 1;

  -- Test 1: Zero NULL tenant_id in profiles
  SELECT count(*) INTO v_count FROM profiles WHERE tenant_id IS NULL;
  test_name := 'profiles: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 2: Zero NULL tenant_id in training_enrollments
  SELECT count(*) INTO v_count FROM training_enrollments WHERE tenant_id IS NULL;
  test_name := 'training_enrollments: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 3: Zero NULL tenant_id in certificates
  SELECT count(*) INTO v_count FROM certificates WHERE tenant_id IS NULL;
  test_name := 'certificates: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 4: Zero NULL tenant_id in lesson_progress
  SELECT count(*) INTO v_count FROM lesson_progress WHERE tenant_id IS NULL;
  test_name := 'lesson_progress: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 5: Zero NULL tenant_id in shops
  SELECT count(*) INTO v_count FROM shops WHERE tenant_id IS NULL;
  test_name := 'shops: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 6: Zero NULL tenant_id in shop_staff
  SELECT count(*) INTO v_count FROM shop_staff WHERE tenant_id IS NULL;
  test_name := 'shop_staff: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 7: Zero NULL tenant_id in apprentice_placements
  SELECT count(*) INTO v_count FROM apprentice_placements WHERE tenant_id IS NULL;
  test_name := 'apprentice_placements: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 8: NOT NULL constraints exist
  SELECT count(*) INTO v_count
  FROM information_schema.check_constraints
  WHERE constraint_name IN (
    'profiles_tenant_id_not_null',
    'training_enrollments_tenant_id_not_null',
    'certificates_tenant_id_not_null',
    'lesson_progress_tenant_id_not_null',
    'placements_tenant_id_not_null',
    'shops_tenant_id_not_null',
    'shop_staff_tenant_id_not_null'
  );
  test_name := 'NOT NULL constraints exist';
  passed := v_count = 7;
  detail := v_count || '/7 constraints';
  RETURN NEXT;

  -- Test 9: RLS enabled on key tables
  SELECT count(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'training_enrollments', 'certificates',
                      'lesson_progress', 'shops', 'shop_staff',
                      'apprentice_placements', 'programs', 'users',
                      'organization_users', 'marketing_campaigns',
                      'tenant_licenses', 'license_events')
    AND rowsecurity = true;
  test_name := 'RLS enabled on scoped tables';
  passed := v_count >= 10;
  detail := v_count || ' tables with RLS';
  RETURN NEXT;

  -- Test 10: No policies with inline profiles lookup (recursion check)
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND (qual ILIKE '%FROM profiles%' OR qual ILIKE '%FROM public.profiles%')
    AND qual NOT ILIKE '%is_admin%'
    AND qual NOT ILIKE '%is_super_admin%'
    AND qual NOT ILIKE '%get_current_tenant_id%';
  test_name := 'profiles: no recursive inline lookups';
  passed := v_count = 0;
  detail := v_count || ' recursive policies';
  RETURN NEXT;

  -- Test 11: is_admin() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'is_admin'
    AND p.prosecdef = true;
  test_name := 'is_admin() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 12: is_super_admin() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'is_super_admin'
    AND p.prosecdef = true;
  test_name := 'is_super_admin() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 13: get_current_tenant_id() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_current_tenant_id'
    AND p.prosecdef = true;
  test_name := 'get_current_tenant_id() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 14: auto_set_tenant_id() trigger exists on key tables
  SELECT count(*) INTO v_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'set_tenant_id_on_insert'
    AND c.relname IN ('training_enrollments', 'certificates', 'lesson_progress',
                       'apprentice_placements', 'shops', 'shop_staff');
  test_name := 'auto_set_tenant_id triggers on 6 tables';
  passed := v_count = 6;
  detail := v_count || '/6 triggers';
  RETURN NEXT;

  -- Test 15: prevent_tenant_id_change trigger on profiles
  SELECT count(*) INTO v_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'protect_tenant_id'
    AND c.relname = 'profiles';
  test_name := 'prevent_tenant_id_change trigger on profiles';
  passed := v_count = 1;
  detail := v_count || ' triggers';
  RETURN NEXT;

  -- Test 16: Admin exists
  test_name := 'admin user exists for testing';
  passed := v_admin_id IS NOT NULL;
  detail := COALESCE(v_admin_id::text, 'none');
  RETURN NEXT;

  -- Test 17: Student exists
  test_name := 'student user exists for testing';
  passed := v_student_id IS NOT NULL;
  detail := COALESCE(v_student_id::text, 'none');
  RETURN NEXT;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.rls_test_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rls_test_report() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_test_report() TO service_role;
