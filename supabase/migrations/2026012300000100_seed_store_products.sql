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
