-- ============================================================================
-- PARTNER COURSES - TWO BUSINESS MODELS
-- 
-- Model 1: PAID MICRO-CLASSES
--   - Student pays YOU via Stripe
--   - YOU pay partner wholesale cost
--   - You keep markup as profit
--   - Student gets course access
--
-- Model 2: DIRECT ENROLLMENT (WIOA/Apprenticeship)
--   - Student clicks link
--   - Goes directly to partner site
--   - No payment involved
--   - You just provide the referral
-- ============================================================================

DO $$
DECLARE
  certiport_id UUID;
  hsi_id UUID;
  jri_id UUID;
  nrf_id UUID;
  careersafe_id UUID;
  milady_id UUID;
  nds_id UUID;
BEGIN
  SELECT id INTO certiport_id FROM partner_lms_providers WHERE provider_type = 'certiport';
  SELECT id INTO hsi_id FROM partner_lms_providers WHERE provider_type = 'hsi';
  SELECT id INTO jri_id FROM partner_lms_providers WHERE provider_type = 'jri';
  SELECT id INTO nrf_id FROM partner_lms_providers WHERE provider_type = 'nrf';
  SELECT id INTO careersafe_id FROM partner_lms_providers WHERE provider_type = 'careersafe';
  SELECT id INTO milady_id FROM partner_lms_providers WHERE provider_type = 'milady';
  SELECT id INTO nds_id FROM partner_lms_providers WHERE provider_type = 'nds';

  -- ============================================================================
  -- CERTIPORT - PAID MICRO-CLASSES
  -- Student pays you $164, you pay Certiport $117, you keep $47 profit
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, enrollment_type, requires_payment, is_active) VALUES
  -- Microsoft Office Specialist
  (certiport_id, 'MOS-WORD-2019', 'Microsoft Office Specialist: Word 2019', 'Demonstrate fundamental Word skills for professional document creation', 'Microsoft Office', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', 'paid', true, true),
  (certiport_id, 'MOS-EXCEL-2019', 'Microsoft Office Specialist: Excel 2019', 'Core Excel skills for data analysis and visualization', 'Microsoft Office', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', 'paid', true, true),
  (certiport_id, 'MOS-POWERPOINT-2019', 'Microsoft Office Specialist: PowerPoint 2019', 'Create professional presentations with animations', 'Microsoft Office', 30, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', 'paid', true, true),
  (certiport_id, 'MOS-WORD-365', 'Microsoft Office Specialist: Word (Microsoft 365)', 'Cloud-based Word skills for modern collaboration', 'Microsoft Office', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', 'paid', true, true),
  (certiport_id, 'MOS-EXCEL-365', 'Microsoft Office Specialist: Excel (Microsoft 365)', 'Cloud-based Excel for data analysis', 'Microsoft Office', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', 'paid', true, true),
  
  -- Adobe Certified Professional
  (certiport_id, 'ACP-PHOTOSHOP', 'Adobe Certified Professional: Photoshop', 'Master photo editing and digital imaging', 'Adobe Creative', 60, 150, 210, 40, 'https://certiport.pearsonvue.com/Certifications/Adobe', 'paid', true, true),
  (certiport_id, 'ACP-ILLUSTRATOR', 'Adobe Certified Professional: Illustrator', 'Vector graphics and logo design', 'Adobe Creative', 60, 150, 210, 40, 'https://certiport.pearsonvue.com/Certifications/Adobe', 'paid', true, true),
  (certiport_id, 'ACP-INDESIGN', 'Adobe Certified Professional: InDesign', 'Professional layout and publishing', 'Adobe Creative', 60, 150, 210, 40, 'https://certiport.pearsonvue.com/Certifications/Adobe', 'paid', true, true),
  
  -- IC3 Digital Literacy
  (certiport_id, 'IC3-COMPUTING', 'IC3 Digital Literacy: Computing Fundamentals', 'Computer hardware, software, and operating systems', 'Digital Literacy', 30, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/IC3', 'paid', true, true),
  (certiport_id, 'IC3-APPLICATIONS', 'IC3 Digital Literacy: Key Applications', 'Word processing, spreadsheets, and presentations', 'Digital Literacy', 30, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/IC3', 'paid', true, true),
  (certiport_id, 'IC3-ONLINE', 'IC3 Digital Literacy: Living Online', 'Internet, email, and online safety', 'Digital Literacy', 30, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/IC3', 'paid', true, true),
  
  -- IT Specialist
  (certiport_id, 'ITS-CYBERSECURITY', 'IT Specialist: Cybersecurity', 'Security fundamentals and threat protection', 'IT Certifications', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/ITSpecialist', 'paid', true, true),
  (certiport_id, 'ITS-PYTHON', 'IT Specialist: Python', 'Python programming fundamentals', 'IT Certifications', 50, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/ITSpecialist', 'paid', true, true),
  (certiport_id, 'ITS-JAVASCRIPT', 'IT Specialist: JavaScript', 'JavaScript web development', 'IT Certifications', 50, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/ITSpecialist', 'paid', true, true),
  (certiport_id, 'ITS-HTML-CSS', 'IT Specialist: HTML and CSS', 'Web page design and styling', 'IT Certifications', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/ITSpecialist', 'paid', true, true);

  -- ============================================================================
  -- HSI - PAID MICRO-CLASSES
  -- Student pays you $135, you pay HSI $85, you keep $50 profit
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, enrollment_type, requires_payment, is_active) VALUES
  -- CPR/First Aid with RSV (these use our custom enrollment flow)
  (hsi_id, 'HSI-CPR-AED', 'Adult CPR/AED with Remote Skills Verification', 'Adult CPR and AED training with remote skills check', 'CPR & First Aid', 2, 85, 135, 59, 'https://training.hsi.com/rsv/enroll/cpr-aed', 'paid', true, true),
  (hsi_id, 'HSI-FIRST-AID', 'Adult First Aid with Remote Skills Verification', 'Adult first aid with remote skills check', 'CPR & First Aid', 2, 85, 135, 59, 'https://training.hsi.com/rsv/enroll/first-aid', 'paid', true, true),
  (hsi_id, 'HSI-CPR-FA', 'Adult CPR/AED + First Aid with RSV', 'Combined CPR and first aid with remote skills check', 'CPR & First Aid', 3, 100, 165, 65, 'https://training.hsi.com/rsv/enroll/cpr-first-aid', 'paid', true, true),
  (hsi_id, 'HSI-BLS', 'BLS for Healthcare Providers with RSV', 'Basic Life Support for medical professionals', 'CPR & First Aid', 4, 100, 165, 65, 'https://training.hsi.com/rsv/enroll/bls', 'paid', true, true),
  
  -- Other HSI courses (direct enrollment)
  (hsi_id, 'HSI-BBP', 'Bloodborne Pathogens', 'OSHA-compliant bloodborne pathogen training', 'Healthcare Safety', 1, 50, 80, 60, 'https://training.hsi.com/courses/bloodborne-pathogens', 'paid', true, true),
  (hsi_id, 'HSI-FIRE', 'Fire Safety', 'Fire prevention and emergency response', 'Workplace Safety', 1, 45, 72, 60, 'https://training.hsi.com/courses/fire-safety', 'paid', true, true),
  (hsi_id, 'HSI-VIOLENCE', 'Workplace Violence Prevention', 'Recognize and prevent workplace violence', 'Workplace Safety', 1, 50, 80, 60, 'https://training.hsi.com/courses/workplace-violence', 'paid', true, true);

  -- ============================================================================
  -- MILADY - PAID MICRO-CLASSES
  -- Student pays you, you pay Milady, you keep markup
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, enrollment_type, requires_payment, is_active) VALUES
  -- RISE Certifications (short micro-classes)
  (milady_id, 'MILADY-RISE-COSMO', 'RISE Cosmetology Certification', 'Industry-recognized cosmetology certification', 'Cosmetology', 20, 29.95, 48, 60, 'https://www.miladytraining.com/bundles/client-well-being-safety-certification', 'paid', true, true),
  (milady_id, 'MILADY-RISE-BARBER', 'RISE Barbering Certification', 'Industry-recognized barbering certification', 'Barbering', 20, 29.95, 48, 60, 'https://www.miladytraining.com/bundles/client-well-being-safety-certification', 'paid', true, true),
  (milady_id, 'MILADY-RISE-ESTH', 'RISE Esthetics Certification', 'Industry-recognized esthetics certification', 'Esthetics', 20, 29.95, 48, 60, 'https://www.miladytraining.com/bundles/client-well-being-safety-certification', 'paid', true, true);

  -- ============================================================================
  -- JRI - DIRECT ENROLLMENT (WIOA/Apprenticeship Programs)
  -- Student clicks link, goes directly to JRI, no payment
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, enrollment_type, requires_payment, is_active) VALUES
  (jri_id, 'JRI-CCMA', 'Certified Clinical Medical Assistant (CCMA)', 'Clinical medical assistant certification program', 'Medical Assistant', 120, 0, 0, 0, 'https://www.jrihealthed.com/medical-assistant', 'wioa', false, true),
  (jri_id, 'JRI-CPT', 'Certified Phlebotomy Technician (CPT)', 'Phlebotomy technician certification program', 'Phlebotomy', 80, 0, 0, 0, 'https://www.jrihealthed.com/phlebotomy', 'wioa', false, true),
  (jri_id, 'JRI-CET', 'Certified EKG Technician (CET)', 'EKG technician certification program', 'EKG/ECG', 60, 0, 0, 0, 'https://www.jrihealthed.com/ekg', 'wioa', false, true),
  (jri_id, 'JRI-CPHT', 'Certified Pharmacy Technician (CPhT)', 'Pharmacy technician certification program', 'Pharmacy', 120, 0, 0, 0, 'https://www.jrihealthed.com/pharmacy-tech', 'wioa', false, true),
  (jri_id, 'JRI-CPCT', 'Certified Patient Care Technician (CPCT)', 'Patient care technician certification program', 'Patient Care', 100, 0, 0, 0, 'https://www.jrihealthed.com/patient-care', 'wioa', false, true),
  (jri_id, 'JRI-CPC', 'Certified Professional Coder (CPC)', 'Medical billing and coding certification program', 'Medical Billing & Coding', 160, 0, 0, 0, 'https://www.jrihealthed.com/medical-coding', 'wioa', false, true);

  -- ============================================================================
  -- NRF RISE UP - DIRECT ENROLLMENT (Free/Low-Cost Retail Training)
  -- Student clicks link, goes directly to NRF, minimal/no payment
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, enrollment_type, requires_payment, is_active) VALUES
  (nrf_id, 'NRF-CS-FUND', 'Customer Service Fundamentals', 'Basic customer service skills for retail', 'Customer Service', 4, 0, 0, 0, 'https://www.riseuptraining.org/courses', 'direct', false, true),
  (nrf_id, 'NRF-RETAIL-FUND', 'Retail Industry Fundamentals', 'Introduction to retail operations', 'Retail Operations', 4, 0, 0, 0, 'https://www.riseuptraining.org/courses', 'direct', false, true),
  (nrf_id, 'NRF-SALES-FUND', 'Sales Fundamentals', 'Basic sales techniques for retail', 'Sales', 4, 0, 0, 0, 'https://www.riseuptraining.org/courses', 'direct', false, true),
  (nrf_id, 'NRF-MGR', 'Store Manager Certification', 'Retail management certification', 'Management', 12, 50, 65, 30, 'https://www.riseuptraining.org/courses', 'paid', true, true);

  -- ============================================================================
  -- CAREERSAFE - PAID MICRO-CLASSES
  -- Student pays you, you pay CareerSafe, you keep markup
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, enrollment_type, requires_payment, is_active) VALUES
  (careersafe_id, 'CS-OSHA10-GI', 'OSHA 10-Hour General Industry', 'OSHA 10-hour safety certification for general industry', 'OSHA Safety', 10, 25, 35, 40, 'https://www.careersafeonline.com/osha-10-general-industry', 'paid', true, true),
  (careersafe_id, 'CS-OSHA10-CONST', 'OSHA 10-Hour Construction', 'OSHA 10-hour safety certification for construction', 'OSHA Safety', 10, 25, 35, 40, 'https://www.careersafeonline.com/osha-10-construction', 'paid', true, true),
  (careersafe_id, 'CS-OSHA30-GI', 'OSHA 30-Hour General Industry', 'OSHA 30-hour safety certification for general industry', 'OSHA Safety', 30, 45, 63, 40, 'https://www.careersafeonline.com/osha-30-general-industry', 'paid', true, true),
  (careersafe_id, 'CS-OSHA30-CONST', 'OSHA 30-Hour Construction', 'OSHA 30-hour safety certification for construction', 'OSHA Safety', 30, 45, 63, 40, 'https://www.careersafeonline.com/osha-30-construction', 'paid', true, true),
  (careersafe_id, 'CS-FORKLIFT', 'Forklift Safety Certification', 'OSHA-compliant forklift operator training', 'Equipment Safety', 4, 35, 49, 40, 'https://www.careersafeonline.com/forklift-safety', 'paid', true, true);

  -- ============================================================================
  -- NATIONAL DRUG SCREENING - PAID MICRO-CLASSES
  -- Student pays you, you pay NDS, you keep markup
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, enrollment_type, requires_payment, is_active) VALUES
  (nds_id, 'NDS-DOT-URINE', 'DOT Urine Specimen Collector', 'DOT-compliant urine specimen collection training', 'Drug Testing', 8, 75, 113, 50, 'https://www.nationaldrugscreening.com/training-consulting/', 'paid', true, true),
  (nds_id, 'NDS-BAT', 'Breath Alcohol Technician (BAT)', 'DOT breath alcohol testing certification', 'Drug Testing', 8, 85, 128, 50, 'https://www.nationaldrugscreening.com/training-consulting/', 'paid', true, true),
  (nds_id, 'NDS-COMPLIANCE', 'Drug Testing Compliance Officer', 'Workplace drug testing compliance certification', 'Drug Testing', 16, 150, 225, 50, 'https://www.nationaldrugscreening.com/training-consulting/', 'paid', true, true);

  RAISE NOTICE 'Inserted 40+ courses with two business models:';
  RAISE NOTICE '  - PAID: Student pays you via Stripe, you pay partner';
  RAISE NOTICE '  - DIRECT/WIOA: Student goes directly to partner site';

END $$;
