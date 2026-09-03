-- Seed Programs Data
-- Populate programs table with real training programs
-- Date: December 31, 2025

-- ============================================================================
-- CLEAR EXISTING DATA (Optional - comment out if you want to keep existing)
-- ============================================================================

-- TRUNCATE programs CASCADE;
-- TRUNCATE courses CASCADE;

-- ============================================================================
-- INSERT PROGRAMS
-- ============================================================================

-- Healthcare Programs
INSERT INTO programs (slug, name, description, duration, schedule, delivery, price, credential, etpl_approved, cip_code, active, metadata) VALUES
('cna-certification', 'Certified Nursing Assistant (CNA)', 'Become a Certified Nursing Assistant in just 4-8 weeks. Learn patient care, vital signs, medical terminology, and clinical skills. Includes clinical rotation at local healthcare facilities.', '4-8 weeks', 'Full-time or Part-time', 'Hybrid', 0, 'CNA Certification', true, '51.3902', true, '{"funding": ["WIOA", "WRG"], "provider": "Elevate for Humanity", "format": "Hybrid"}'),

('medical-assistant', 'Medical Assistant Program', 'Comprehensive 720-hour program preparing students for Certified Medical Assistant certification. Learn clinical and administrative healthcare skills.', '6-9 months', 'Full-time', 'Hybrid', 0, 'Certified Medical Assistant (CMA)', true, '51.0801', true, '{"funding": ["WIOA", "WRG", "Pell"], "provider": "Elevate for Humanity / Healthcare Partner", "format": "Hybrid"}'),

-- Skilled Trades Programs
('hvac-technician', 'HVAC Technician Training', '600-hour program covering HVAC installation, maintenance, and repair with EPA 608 certification. Master heating, ventilation, and air conditioning systems.', '16-24 weeks', 'Full-time', 'Hybrid', 0, 'EPA 608, HVAC Certification', true, '47.0201', true, '{"funding": ["WIOA", "WRG", "Apprenticeship"], "provider": "Elevate for Humanity / Trade School Partner", "format": "Hybrid"}'),

('welding-certification', 'Welding Certification Program', 'Learn MIG, TIG, and Stick welding techniques. Prepare for AWS certification. Hands-on training with industry-standard equipment.', '12-16 weeks', 'Full-time', 'In-person', 0, 'AWS Welding Certification', true, '48.0508', true, '{"funding": ["WIOA", "WRG"], "provider": "Elevate for Humanity / Welding Partner", "format": "In-person"}'),

('cdl-training', 'Commercial Driver License (CDL) Training', 'Get your Class A CDL in 3-6 weeks. Includes classroom instruction, behind-the-wheel training, and job placement assistance.', '3-6 weeks', 'Full-time', 'In-person', 0, 'Class A CDL', true, '49.0205', true, '{"funding": ["WIOA", "WRG"], "provider": "Elevate for Humanity / CDL Partner", "format": "In-person"}'),

-- Beauty & Barbering Programs
('barber-apprenticeship', 'Barber Apprenticeship Program', '1,500-hour DOL-registered apprenticeship combining classroom and shop training. Earn while you learn. State barber license upon completion.', '15-17 months', 'Full-time', 'Apprenticeship', 0, 'State Barber License', true, '12.0402', true, '{"funding": ["WIOA", "Apprenticeship", "WRG", "DWD"], "provider": "Elevate for Humanity / Licensed Barbershop", "format": "Apprenticeship"}'),

('cosmetology-program', 'Professional Cosmetology Program', '1,500-hour program leading to state cosmetology license. Learn hair, skin, and nail care. Includes salon management and business skills.', '12-18 months', 'Full-time or Part-time', 'In-person', 0, 'State Cosmetology License', true, '12.0401', true, '{"funding": ["WIOA", "WRG", "Pell"], "provider": "Elevate for Humanity / Licensed School", "format": "In-person"}'),

('esthetician-program', 'Professional Esthetician Program', '700-hour program leading to state esthetician license. Skincare specialist training including facials, waxing, and makeup application.', '6-9 months', 'Full-time or Part-time', 'Hybrid', 0, 'State Esthetician License', true, '12.0409', true, '{"funding": ["WIOA", "WRG", "Pell"], "provider": "Elevate for Humanity / Licensed School", "format": "Hybrid"}'),

-- Business & Entrepreneurship Programs
('business-startup', 'Business Start-Up & Marketing Program', 'Learn entrepreneurship, digital marketing, LLC formation, and business planning. Launch your own business with Rise Forward.', '4-6 weeks', 'Part-time', '100% Online', 0, 'Certificate of Completion', true, '52.0701', true, '{"funding": ["WIOA", "WRG"], "provider": "Rise Forward / Elevate for Humanity", "format": "100% Online"}'),

('retail-fundamentals', 'NRF Rise Up Certificate', '40-hour online program covering retail customer service and operations. National Retail Federation certification.', '4-6 weeks', 'Self-paced', '100% Online', 0, 'NRF Customer Service Certification', true, '52.1801', true, '{"funding": ["WIOA", "WRG"], "provider": "National Retail Federation / Elevate for Humanity", "format": "100% Online"}'),

-- Technology Programs
('it-support-specialist', 'IT Support Specialist', 'Learn computer hardware, software, networking, and troubleshooting. Prepare for CompTIA A+ certification.', '12-16 weeks', 'Full-time', 'Hybrid', 0, 'CompTIA A+ Certification', true, '11.0901', true, '{"funding": ["WIOA", "WRG"], "provider": "Elevate for Humanity", "format": "Hybrid"}'),

-- Social Services Programs
('direct-support-professional', 'Direct Support Professional (DSP)', '120-hour program preparing students for DSP certification. Support individuals with disabilities in community settings.', '4-6 weeks', 'Part-time', 'Hybrid', 0, 'DSP Certification, CPR/First Aid', true, '51.1599', true, '{"funding": ["WIOA", "WRG"], "provider": "Elevate for Humanity", "format": "Hybrid"}'),

('peer-support-specialist', 'Certified Peer Support Professional', '80-hour program preparing students for peer support certification. Support individuals in recovery and mental health services.', '3-4 weeks', 'Part-time', 'Hybrid', 0, 'Peer Support Specialist Certification', true, '51.1508', true, '{"funding": ["WIOA", "WRG"], "provider": "Elevate for Humanity", "format": "Hybrid"}'),

-- Tax & Financial Services
('tax-preparation', 'Tax Preparation & Financial Services', '80-hour program preparing students for tax preparation certification. Become a certified tax preparer with IRS PTIN.', '6-8 weeks', 'Part-time', '100% Online', 0, 'IRS PTIN, Tax Preparer Certification', true, '52.0803', true, '{"funding": ["WIOA", "WRG"], "provider": "Elevate for Humanity", "format": "100% Online"}'),

-- Safety & Compliance
('cpr-first-aid', 'CPR & First Aid Certification', '8-hour program leading to CPR/AED/First Aid certification. Life-saving skills training from American Heart Association.', '1 day', 'One-time', 'In-person', 0, 'CPR/AED/First Aid Certification', true, '51.0904', true, '{"funding": ["WIOA", "WRG"], "provider": "Elevate for Humanity / AHA Certified", "format": "In-person"}')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  schedule = EXCLUDED.schedule,
  delivery = EXCLUDED.delivery,
  price = EXCLUDED.price,
  credential = EXCLUDED.credential,
  etpl_approved = EXCLUDED.etpl_approved,
  cip_code = EXCLUDED.cip_code,
  active = EXCLUDED.active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- VERIFY DATA
-- ============================================================================

-- Count programs
SELECT COUNT(*) as total_programs FROM programs WHERE active = true;

-- List all programs
SELECT slug, name, duration, credential, etpl_approved 
FROM programs 
WHERE active = true 
ORDER BY name;

-- Programs by funding source
SELECT 
  metadata->>'funding' as funding_sources,
  COUNT(*) as program_count
FROM programs 
WHERE active = true 
GROUP BY metadata->>'funding';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Successfully seeded % programs', (SELECT COUNT(*) FROM programs WHERE active = true);
END $$;
