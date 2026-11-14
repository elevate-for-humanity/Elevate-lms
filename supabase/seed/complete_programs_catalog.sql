-- ============================================
-- COMPLETE PROGRAMS CATALOG
-- All 27+ Programs with Full Integration
-- ============================================

-- Clear existing programs (optional - comment out if you want to keep existing)
-- TRUNCATE programs CASCADE;

-- ============================================
-- HEALTHCARE PROGRAMS
-- ============================================

INSERT INTO programs (
  id, name, slug, category, description, duration, tuition, 
  is_active, is_featured, image_url, skills, prerequisites, 
  certification, job_titles, salary_range, placement_rate, created_at
) VALUES
-- CNA (Certified Nursing Assistant)
(
  gen_random_uuid(),
  'Certified Nursing Assistant (CNA)',
  'cna',
  'healthcare',
  'Get certified fast and start your healthcare career. Work in hospitals, nursing homes, or home health with stable income and flexible schedules.',
  '4-8 weeks',
  575,
  true,
  true,
  '/images/healthcare/cna-training.jpg',
  ARRAY['Patient Care', 'Vital Signs', 'Medical Terminology', 'Infection Control', 'CPR'],
  'High school diploma or GED',
  'State CNA Certification',
  ARRAY['Certified Nursing Assistant', 'Patient Care Technician', 'Home Health Aide'],
  '$28,000 - $38,000',
  85,
  NOW()
),

-- Phlebotomy Technician
(
  gen_random_uuid(),
  'Phlebotomy Technician',
  'phlebotomy',
  'healthcare',
  'Learn blood collection techniques and laboratory procedures. High demand in hospitals, clinics, and diagnostic laboratories.',
  '6-8 weeks',
  1200,
  true,
  true,
  '/images/healthcare/phlebotomy.jpg',
  ARRAY['Venipuncture', 'Blood Collection', 'Laboratory Safety', 'Patient Care', 'Medical Terminology'],
  'High school diploma or GED',
  'Certified Phlebotomy Technician (CPT)',
  ARRAY['Phlebotomy Technician', 'Laboratory Assistant', 'Blood Bank Technician'],
  '$30,000 - $42,000',
  80,
  NOW()
),

-- Medical Assistant
(
  gen_random_uuid(),
  'Medical Assistant',
  'medical-assistant',
  'healthcare',
  'Comprehensive training in clinical and administrative medical office procedures. Work in physician offices, clinics, and healthcare facilities.',
  '8-12 weeks',
  4325,
  true,
  true,
  '/images/healthcare/medical-assistant.jpg',
  ARRAY['Clinical Procedures', 'Medical Coding', 'EHR Systems', 'Patient Care', 'Administrative Skills'],
  'High school diploma or GED',
  'Certified Medical Assistant (CMA)',
  ARRAY['Medical Assistant', 'Clinical Assistant', 'Healthcare Coordinator'],
  '$32,000 - $45,000',
  82,
  NOW()
),

-- Emergency Health & Safety Technician
(
  gen_random_uuid(),
  'Emergency Health & Safety Technician',
  'emergency-health-safety',
  'healthcare',
  'Prepare for emergency response and workplace safety roles. Includes CPR, First Aid, AED, and OSHA safety training.',
  '10-12 weeks',
  4950,
  true,
  false,
  '/images/healthcare/emergency-safety.jpg',
  ARRAY['CPR/AED', 'First Aid', 'Emergency Response', 'OSHA Safety', 'Workplace Safety'],
  'High school diploma or GED',
  'Emergency Medical Responder (EMR)',
  ARRAY['Safety Technician', 'Emergency Responder', 'Safety Coordinator'],
  '$35,000 - $48,000',
  78,
  NOW()
),

-- ============================================
-- SKILLED TRADES PROGRAMS
-- ============================================

-- Barber Apprenticeship
(
  gen_random_uuid(),
  'Barber Apprenticeship',
  'barber-apprenticeship',
  'skilled-trades',
  'DOL registered apprenticeship. Work in a real barbershop, get paid while you train, build your clientele. Own your chair or open your own shop.',
  '12-18 months',
  4890,
  true,
  true,
  '/images/barber-professional.jpg',
  ARRAY['Hair Cutting', 'Shaving', 'Beard Trimming', 'Customer Service', 'Business Management'],
  'High school diploma or GED, Age 16+',
  'State Barber License',
  ARRAY['Licensed Barber', 'Master Barber', 'Shop Owner'],
  '$30,000 - $60,000+',
  90,
  NOW()
),

-- HVAC Technician
(
  gen_random_uuid(),
  'HVAC Technician',
  'hvac-technician',
  'skilled-trades',
  'Learn heating, cooling, and refrigeration systems. High demand, good pay, job security. Start your own business or work for a company.',
  '8-12 weeks',
  5000,
  true,
  true,
  '/images/hvac-highlight.png',
  ARRAY['HVAC Systems', 'Refrigeration', 'Electrical', 'Troubleshooting', 'Customer Service'],
  'High school diploma or GED',
  'EPA 608 Certification, HVAC Excellence',
  ARRAY['HVAC Technician', 'HVAC Installer', 'Service Technician'],
  '$40,000 - $65,000',
  85,
  NOW()
),

-- Welding Technology
(
  gen_random_uuid(),
  'Welding Technology',
  'welding',
  'skilled-trades',
  'Master various welding techniques including MIG, TIG, and Stick welding. High-paying career in manufacturing, construction, and fabrication.',
  '12-16 weeks',
  5500,
  true,
  false,
  '/images/trades/welding.jpg',
  ARRAY['MIG Welding', 'TIG Welding', 'Stick Welding', 'Blueprint Reading', 'Metal Fabrication'],
  'High school diploma or GED',
  'AWS Certified Welder',
  ARRAY['Welder', 'Welding Inspector', 'Fabricator'],
  '$38,000 - $62,000',
  88,
  NOW()
),

-- Electrical Technician
(
  gen_random_uuid(),
  'Electrical Technician',
  'electrical',
  'skilled-trades',
  'Comprehensive electrical training for residential and commercial applications. Prepare for electrician apprenticeship or entry-level positions.',
  '10-14 weeks',
  5200,
  true,
  false,
  '/images/trades/electrical.jpg',
  ARRAY['Electrical Theory', 'Wiring', 'Code Compliance', 'Troubleshooting', 'Safety'],
  'High school diploma or GED',
  'OSHA 10, Electrical Safety',
  ARRAY['Electrical Technician', 'Electrician Helper', 'Maintenance Electrician'],
  '$42,000 - $68,000',
  83,
  NOW()
),

-- Plumbing Technology
(
  gen_random_uuid(),
  'Plumbing Technology',
  'plumbing',
  'skilled-trades',
  'Learn residential and commercial plumbing systems. Prepare for plumber apprenticeship with hands-on training.',
  '10-12 weeks',
  4800,
  true,
  false,
  '/images/trades/plumbing.jpg',
  ARRAY['Pipe Installation', 'Fixture Installation', 'Code Compliance', 'Troubleshooting', 'Customer Service'],
  'High school diploma or GED',
  'OSHA 10, Plumbing Fundamentals',
  ARRAY['Plumber Helper', 'Plumbing Technician', 'Service Plumber'],
  '$40,000 - $65,000',
  80,
  NOW()
),

-- ============================================
-- BUSINESS & PROFESSIONAL PROGRAMS
-- ============================================

-- Tax Preparation & Financial Services
(
  gen_random_uuid(),
  'Tax Preparation & Financial Services',
  'tax-prep',
  'business',
  'Become a certified tax preparer. Learn individual and business tax preparation, financial planning, and bookkeeping. Start your own practice or work for established firms.',
  '10-12 weeks',
  4950,
  true,
  true,
  '/images/business/tax-prep.jpg',
  ARRAY['Tax Preparation', 'Bookkeeping', 'Financial Planning', 'IRS Regulations', 'Client Management'],
  'High school diploma or GED',
  'IRS PTIN, Tax Preparer Certification',
  ARRAY['Tax Preparer', 'Bookkeeper', 'Financial Consultant'],
  '$35,000 - $55,000',
  75,
  NOW()
),

-- Business Startup & Marketing
(
  gen_random_uuid(),
  'Business Startup & Marketing',
  'business-startup',
  'business',
  'Learn to start and grow your own business. Covers business planning, marketing, social media, and operations management.',
  '8-10 weeks',
  4550,
  true,
  false,
  '/images/business/startup.jpg',
  ARRAY['Business Planning', 'Marketing', 'Social Media', 'Financial Management', 'Operations'],
  'High school diploma or GED',
  'Business Management Certificate',
  ARRAY['Business Owner', 'Marketing Specialist', 'Operations Manager'],
  '$40,000 - $80,000+',
  70,
  NOW()
),

-- Customer Service Professional
(
  gen_random_uuid(),
  'Customer Service Professional',
  'customer-service',
  'business',
  'Develop essential customer service skills for call centers, retail, hospitality, and office environments.',
  '4-6 weeks',
  1200,
  true,
  false,
  '/images/business/customer-service.jpg',
  ARRAY['Communication', 'Problem Solving', 'CRM Software', 'Conflict Resolution', 'Professional Skills'],
  'High school diploma or GED',
  'Customer Service Excellence Certificate',
  ARRAY['Customer Service Representative', 'Call Center Agent', 'Client Services Specialist'],
  '$28,000 - $42,000',
  85,
  NOW()
),

-- Administrative Office Professional
(
  gen_random_uuid(),
  'Administrative Office Professional',
  'office-admin',
  'business',
  'Comprehensive office skills training including Microsoft Office, communication, organization, and professional development.',
  '6-8 weeks',
  2400,
  true,
  false,
  '/images/business/office-admin.jpg',
  ARRAY['Microsoft Office', 'Office Management', 'Communication', 'Organization', 'Professional Skills'],
  'High school diploma or GED',
  'Microsoft Office Specialist (MOS)',
  ARRAY['Administrative Assistant', 'Office Manager', 'Executive Assistant'],
  '$32,000 - $48,000',
  80,
  NOW()
),

-- ============================================
-- BEAUTY & COSMETOLOGY PROGRAMS
-- ============================================

-- Professional Esthetician
(
  gen_random_uuid(),
  'Professional Esthetician',
  'esthetician',
  'beauty',
  'Comprehensive skincare training including facials, waxing, makeup, and spa treatments. Start your own practice or work in spas and salons.',
  '12-16 weeks',
  4575,
  true,
  false,
  '/images/beauty/esthetician.jpg',
  ARRAY['Skincare', 'Facials', 'Waxing', 'Makeup Application', 'Client Consultation'],
  'High school diploma or GED, Age 16+',
  'State Esthetician License',
  ARRAY['Licensed Esthetician', 'Spa Technician', 'Skincare Specialist'],
  '$28,000 - $50,000',
  82,
  NOW()
),

-- Nail Technician
(
  gen_random_uuid(),
  'Nail Technician',
  'nail-tech',
  'beauty',
  'Professional nail care training including manicures, pedicures, nail art, and salon management.',
  '8-10 weeks',
  3200,
  true,
  false,
  '/images/beauty/nail-tech.jpg',
  ARRAY['Manicures', 'Pedicures', 'Nail Art', 'Sanitation', 'Customer Service'],
  'High school diploma or GED, Age 16+',
  'State Nail Technician License',
  ARRAY['Nail Technician', 'Salon Owner', 'Nail Artist'],
  '$25,000 - $45,000',
  85,
  NOW()
),

-- Cosmetology
(
  gen_random_uuid(),
  'Cosmetology',
  'cosmetology',
  'beauty',
  'Complete beauty training including hair, nails, skincare, and makeup. Comprehensive program for full cosmetology license.',
  '9-12 months',
  12000,
  true,
  false,
  '/images/beauty/cosmetology.jpg',
  ARRAY['Hair Styling', 'Hair Coloring', 'Nail Care', 'Skincare', 'Makeup', 'Salon Management'],
  'High school diploma or GED, Age 16+',
  'State Cosmetology License',
  ARRAY['Cosmetologist', 'Salon Owner', 'Beauty Specialist'],
  '$30,000 - $60,000+',
  88,
  NOW()
),

-- ============================================
-- SOCIAL SERVICES & COUNSELING
-- ============================================

-- Peer Recovery Coach
(
  gen_random_uuid(),
  'Peer Recovery Coach',
  'peer-recovery',
  'social-services',
  'Train to support individuals in addiction recovery. Work in treatment centers, community organizations, and healthcare facilities.',
  '10-12 weeks',
  4750,
  true,
  false,
  '/images/social/peer-recovery.jpg',
  ARRAY['Recovery Support', 'Counseling Skills', 'Crisis Intervention', 'Case Management', 'Ethics'],
  'High school diploma or GED, Personal recovery experience preferred',
  'Certified Peer Recovery Coach',
  ARRAY['Peer Recovery Coach', 'Recovery Support Specialist', 'Case Manager'],
  '$32,000 - $45,000',
  78,
  NOW()
),

-- Community Health Worker
(
  gen_random_uuid(),
  'Community Health Worker',
  'community-health',
  'social-services',
  'Bridge between communities and healthcare systems. Provide health education, advocacy, and support services.',
  '8-10 weeks',
  3800,
  true,
  false,
  '/images/social/community-health.jpg',
  ARRAY['Health Education', 'Community Outreach', 'Case Management', 'Cultural Competency', 'Advocacy'],
  'High school diploma or GED',
  'Certified Community Health Worker',
  ARRAY['Community Health Worker', 'Health Educator', 'Outreach Coordinator'],
  '$30,000 - $42,000',
  75,
  NOW()
),

-- ============================================
-- TECHNOLOGY & IT PROGRAMS
-- ============================================

-- IT Support Specialist
(
  gen_random_uuid(),
  'IT Support Specialist',
  'it-support',
  'technology',
  'Entry-level IT training covering hardware, software, networking, and troubleshooting. Prepare for CompTIA A+ certification.',
  '10-12 weeks',
  4200,
  true,
  false,
  '/images/technology/it-support.jpg',
  ARRAY['Hardware', 'Software', 'Networking', 'Troubleshooting', 'Customer Support'],
  'High school diploma or GED',
  'CompTIA A+',
  ARRAY['IT Support Specialist', 'Help Desk Technician', 'Desktop Support'],
  '$38,000 - $55,000',
  82,
  NOW()
),

-- Cybersecurity Fundamentals
(
  gen_random_uuid(),
  'Cybersecurity Fundamentals',
  'cybersecurity',
  'technology',
  'Introduction to cybersecurity concepts, threat detection, and security best practices. Prepare for Security+ certification.',
  '12-14 weeks',
  5500,
  true,
  false,
  '/images/technology/cybersecurity.jpg',
  ARRAY['Network Security', 'Threat Detection', 'Risk Management', 'Security Tools', 'Compliance'],
  'High school diploma or GED, Basic IT knowledge',
  'CompTIA Security+',
  ARRAY['Security Analyst', 'Security Technician', 'IT Security Specialist'],
  '$50,000 - $75,000',
  85,
  NOW()
),

-- Web Development Fundamentals
(
  gen_random_uuid(),
  'Web Development Fundamentals',
  'web-development',
  'technology',
  'Learn HTML, CSS, JavaScript, and responsive design. Build websites and prepare for entry-level web development roles.',
  '12-16 weeks',
  4800,
  true,
  false,
  '/images/technology/web-dev.jpg',
  ARRAY['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'Git/GitHub'],
  'High school diploma or GED',
  'Web Development Certificate',
  ARRAY['Junior Web Developer', 'Front-End Developer', 'Web Designer'],
  '$45,000 - $70,000',
  80,
  NOW()
),

-- ============================================
-- TRANSPORTATION & LOGISTICS
-- ============================================

-- Commercial Driver License (CDL) Training
(
  gen_random_uuid(),
  'Commercial Driver License (CDL) Training',
  'cdl-training',
  'transportation',
  'Professional truck driving training. Prepare for CDL Class A license with hands-on training and job placement assistance.',
  '4-6 weeks',
  4500,
  true,
  false,
  '/images/transportation/cdl.jpg',
  ARRAY['Vehicle Operation', 'Safety Regulations', 'Pre-Trip Inspection', 'Backing', 'Road Skills'],
  'Valid driver license, Age 21+, Clean driving record',
  'CDL Class A License',
  ARRAY['Truck Driver', 'Delivery Driver', 'Transportation Specialist'],
  '$45,000 - $70,000',
  92,
  NOW()
),

-- Forklift Operator Certification
(
  gen_random_uuid(),
  'Forklift Operator Certification',
  'forklift',
  'transportation',
  'OSHA-compliant forklift training. Get certified and start working in warehouses, distribution centers, and manufacturing.',
  '1-2 weeks',
  500,
  true,
  false,
  '/images/transportation/forklift.jpg',
  ARRAY['Forklift Operation', 'Safety', 'Load Handling', 'Warehouse Operations'],
  'Age 18+',
  'OSHA Forklift Certification',
  ARRAY['Forklift Operator', 'Warehouse Worker', 'Material Handler'],
  '$30,000 - $42,000',
  90,
  NOW()
),

-- ============================================
-- HOSPITALITY & FOOD SERVICE
-- ============================================

-- Culinary Arts Fundamentals
(
  gen_random_uuid(),
  'Culinary Arts Fundamentals',
  'culinary',
  'hospitality',
  'Professional cooking techniques, food safety, and kitchen management. Start your culinary career or open your own restaurant.',
  '12-16 weeks',
  5200,
  true,
  false,
  '/images/hospitality/culinary.jpg',
  ARRAY['Cooking Techniques', 'Food Safety', 'Menu Planning', 'Kitchen Management', 'Nutrition'],
  'High school diploma or GED',
  'ServSafe Food Handler, Culinary Certificate',
  ARRAY['Line Cook', 'Prep Cook', 'Chef de Partie'],
  '$28,000 - $48,000',
  80,
  NOW()
),

-- Hospitality Management
(
  gen_random_uuid(),
  'Hospitality Management',
  'hospitality-management',
  'hospitality',
  'Hotel and restaurant management training. Learn operations, customer service, and business management for hospitality industry.',
  '10-12 weeks',
  4200,
  true,
  false,
  '/images/hospitality/management.jpg',
  ARRAY['Operations Management', 'Customer Service', 'Staff Management', 'Revenue Management', 'Marketing'],
  'High school diploma or GED',
  'Hospitality Management Certificate',
  ARRAY['Hotel Manager', 'Restaurant Manager', 'Front Desk Manager'],
  '$35,000 - $55,000',
  75,
  NOW()
),

-- ============================================
-- MANUFACTURING & PRODUCTION
-- ============================================

-- CNC Machine Operator
(
  gen_random_uuid(),
  'CNC Machine Operator',
  'cnc-operator',
  'manufacturing',
  'Computer numerical control machine operation. High-demand manufacturing career with excellent pay and job security.',
  '10-14 weeks',
  5800,
  true,
  false,
  '/images/manufacturing/cnc.jpg',
  ARRAY['CNC Operation', 'Blueprint Reading', 'Precision Measurement', 'Quality Control', 'Safety'],
  'High school diploma or GED',
  'NIMS CNC Operator Certification',
  ARRAY['CNC Operator', 'CNC Machinist', 'Manufacturing Technician'],
  '$40,000 - $60,000',
  88,
  NOW()
),

-- Quality Control Inspector
(
  gen_random_uuid(),
  'Quality Control Inspector',
  'quality-control',
  'manufacturing',
  'Learn inspection techniques, measurement tools, and quality assurance processes for manufacturing environments.',
  '6-8 weeks',
  3200,
  true,
  false,
  '/images/manufacturing/quality-control.jpg',
  ARRAY['Inspection', 'Measurement', 'Quality Standards', 'Documentation', 'Problem Solving'],
  'High school diploma or GED',
  'Quality Control Certificate',
  ARRAY['Quality Control Inspector', 'QA Technician', 'Inspector'],
  '$35,000 - $52,000',
  82,
  NOW()
),

-- ============================================
-- CERTIFICATION & SHORT COURSES
-- ============================================

-- CPR & First Aid Certification
(
  gen_random_uuid(),
  'CPR & First Aid Certification',
  'cpr-first-aid',
  'certification',
  'American Heart Association CPR, AED, and First Aid certification. Required for many healthcare and safety positions.',
  '1 day',
  75,
  true,
  false,
  '/images/certifications/cpr.jpg',
  ARRAY['CPR', 'AED', 'First Aid', 'Emergency Response'],
  'None',
  'AHA CPR/First Aid Certification',
  ARRAY['Healthcare Worker', 'Safety Officer', 'Childcare Provider'],
  'N/A - Certification Only',
  100,
  NOW()
),

-- OSHA 10-Hour Safety Training
(
  gen_random_uuid(),
  'OSHA 10-Hour Safety Training',
  'osha-10',
  'certification',
  'OSHA 10-hour safety training for construction or general industry. Required for many job sites and employers.',
  '2 days',
  150,
  true,
  false,
  '/images/certifications/osha.jpg',
  ARRAY['Workplace Safety', 'Hazard Recognition', 'OSHA Regulations', 'PPE', 'Emergency Procedures'],
  'None',
  'OSHA 10-Hour Card',
  ARRAY['Construction Worker', 'Safety Coordinator', 'Site Supervisor'],
  'N/A - Certification Only',
  100,
  NOW()
)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  tuition = EXCLUDED.tuition,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  skills = EXCLUDED.skills,
  prerequisites = EXCLUDED.prerequisites,
  certification = EXCLUDED.certification,
  job_titles = EXCLUDED.job_titles,
  salary_range = EXCLUDED.salary_range,
  placement_rate = EXCLUDED.placement_rate,
  updated_at = NOW();

-- ============================================
-- PROGRAM STATISTICS
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
  v_categories TEXT[];
BEGIN
  SELECT COUNT(*), array_agg(DISTINCT category) 
  INTO v_count, v_categories
  FROM programs;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PROGRAMS CATALOG COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Programs: %', v_count;
  RAISE NOTICE 'Categories: %', array_to_string(v_categories, ', ');
  RAISE NOTICE 'Featured Programs: %', (SELECT COUNT(*) FROM programs WHERE is_featured = true);
  RAISE NOTICE 'Active Programs: %', (SELECT COUNT(*) FROM programs WHERE is_active = true);
  RAISE NOTICE 'Average Tuition: $%', (SELECT ROUND(AVG(tuition)) FROM programs);
  RAISE NOTICE 'Average Placement Rate: %%', (SELECT ROUND(AVG(placement_rate)) FROM programs);
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ PROGRAM CATALOG VALUE: MAXIMIZED';
  RAISE NOTICE '============================================';
END $$;
