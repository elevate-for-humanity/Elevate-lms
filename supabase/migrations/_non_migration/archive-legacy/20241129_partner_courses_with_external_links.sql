-- ============================================================================
-- PARTNER COURSES WITH EXTERNAL ENROLLMENT LINKS
-- Students browse on our site, enroll on partner sites
-- ============================================================================

-- Clear existing courses (optional - comment out if you want to keep sample data)
-- DELETE FROM partner_courses;

-- Get provider IDs
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
  -- CERTIPORT COURSES - MICRO-CLASSES (Student pays you, you pay Certiport)
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, enrollment_type, requires_payment, is_active) VALUES
  -- Microsoft Office Specialist
  (certiport_id, 'MOS-WORD-2019', 'Microsoft Office Specialist: Word 2019', 'Demonstrate fundamental Word skills', 'Microsoft Office', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', 'paid', true, true),
  (certiport_id, 'MOS-EXCEL-2019', 'Microsoft Office Specialist: Excel 2019', 'Core Excel skills for data analysis', 'Microsoft Office', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', true),
  (certiport_id, 'MOS-POWERPOINT-2019', 'Microsoft Office Specialist: PowerPoint 2019', 'Create professional presentations', 'Microsoft Office', 30, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', true),
  (certiport_id, 'MOS-WORD-365', 'Microsoft Office Specialist: Word (Microsoft 365)', 'Cloud-based Word skills', 'Microsoft Office', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', true),
  (certiport_id, 'MOS-EXCEL-365', 'Microsoft Office Specialist: Excel (Microsoft 365)', 'Cloud-based Excel skills', 'Microsoft Office', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/Microsoft/MOS/Overview', true),
  
  -- Adobe
  (certiport_id, 'ACP-PHOTOSHOP', 'Adobe Certified Professional: Photoshop', 'Master photo editing and digital imaging', 'Adobe Creative', 60, 150, 210, 40, 'https://certiport.pearsonvue.com/Certifications/Adobe', true),
  (certiport_id, 'ACP-ILLUSTRATOR', 'Adobe Certified Professional: Illustrator', 'Vector graphics and logo design', 'Adobe Creative', 60, 150, 210, 40, 'https://certiport.pearsonvue.com/Certifications/Adobe', true),
  (certiport_id, 'ACP-INDESIGN', 'Adobe Certified Professional: InDesign', 'Professional layout and publishing', 'Adobe Creative', 60, 150, 210, 40, 'https://certiport.pearsonvue.com/Certifications/Adobe', true),
  
  -- IC3 Digital Literacy
  (certiport_id, 'IC3-COMPUTING', 'IC3 Digital Literacy: Computing Fundamentals', 'Computer hardware, software, and OS', 'Digital Literacy', 30, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/IC3', true),
  (certiport_id, 'IC3-APPLICATIONS', 'IC3 Digital Literacy: Key Applications', 'Word processing, spreadsheets, presentations', 'Digital Literacy', 30, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/IC3', true),
  (certiport_id, 'IC3-ONLINE', 'IC3 Digital Literacy: Living Online', 'Internet, email, and online safety', 'Digital Literacy', 30, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/IC3', true),
  
  -- IT Specialist
  (certiport_id, 'ITS-CYBERSECURITY', 'IT Specialist: Cybersecurity', 'Security fundamentals and threat protection', 'IT Certifications', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/ITSpecialist', true),
  (certiport_id, 'ITS-PYTHON', 'IT Specialist: Python', 'Python programming fundamentals', 'IT Certifications', 50, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/ITSpecialist', true),
  (certiport_id, 'ITS-JAVASCRIPT', 'IT Specialist: JavaScript', 'JavaScript web development', 'IT Certifications', 50, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/ITSpecialist', true),
  (certiport_id, 'ITS-HTML-CSS', 'IT Specialist: HTML and CSS', 'Web page design and styling', 'IT Certifications', 40, 117, 164, 40, 'https://certiport.pearsonvue.com/Certifications/ITSpecialist', true);

  -- ============================================================================
  -- HSI COURSES - Students enroll at training.hsi.com
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, is_active) VALUES
  -- CPR/First Aid with RSV
  (hsi_id, 'HSI-CPR-AED', 'Adult CPR/AED with Remote Skills Verification', 'Adult CPR and AED training with remote skills check', 'CPR & First Aid', 2, 85, 135, 59, 'https://training.hsi.com/rsv/enroll/cpr-aed', true),
  (hsi_id, 'HSI-FIRST-AID', 'Adult First Aid with Remote Skills Verification', 'Adult first aid with remote skills check', 'CPR & First Aid', 2, 85, 135, 59, 'https://training.hsi.com/rsv/enroll/first-aid', true),
  (hsi_id, 'HSI-CPR-FA', 'Adult CPR/AED + First Aid with RSV', 'Combined CPR and first aid with remote skills check', 'CPR & First Aid', 3, 100, 165, 65, 'https://training.hsi.com/rsv/enroll/cpr-first-aid', true),
  (hsi_id, 'HSI-BLS', 'BLS for Healthcare Providers with RSV', 'Basic Life Support for medical professionals', 'CPR & First Aid', 4, 100, 165, 65, 'https://training.hsi.com/rsv/enroll/bls', true),
  
  -- Bloodborne Pathogens
  (hsi_id, 'HSI-BBP', 'Bloodborne Pathogens', 'OSHA-compliant bloodborne pathogen training', 'Healthcare Safety', 1, 50, 80, 60, 'https://training.hsi.com/courses/bloodborne-pathogens', true),
  
  -- Workplace Safety
  (hsi_id, 'HSI-FIRE', 'Fire Safety', 'Fire prevention and emergency response', 'Workplace Safety', 1, 45, 72, 60, 'https://training.hsi.com/courses/fire-safety', true),
  (hsi_id, 'HSI-VIOLENCE', 'Workplace Violence Prevention', 'Recognize and prevent workplace violence', 'Workplace Safety', 1, 50, 80, 60, 'https://training.hsi.com/courses/workplace-violence', true),
  (hsi_id, 'HSI-ACTIVE-SHOOTER', 'Active Shooter Response', 'Emergency response to active threats', 'Workplace Safety', 1, 50, 80, 60, 'https://training.hsi.com/courses/active-shooter', true);

  -- ============================================================================
  -- MILADY COURSES - Students enroll at miladytraining.com
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, is_active) VALUES
  -- RISE Certifications
  (milady_id, 'MILADY-RISE-COSMO', 'RISE Cosmetology Certification', 'Industry-recognized cosmetology certification', 'Cosmetology', 20, 29.95, 48, 60, 'https://www.miladytraining.com/bundles/client-well-being-safety-certification', true),
  (milady_id, 'MILADY-RISE-BARBER', 'RISE Barbering Certification', 'Industry-recognized barbering certification', 'Barbering', 20, 29.95, 48, 60, 'https://www.miladytraining.com/bundles/client-well-being-safety-certification', true),
  (milady_id, 'MILADY-RISE-ESTH', 'RISE Esthetics Certification', 'Industry-recognized esthetics certification', 'Esthetics', 20, 29.95, 48, 60, 'https://www.miladytraining.com/bundles/client-well-being-safety-certification', true),
  
  -- Professional Makeup
  (milady_id, 'MILADY-MAKEUP-INSPIRE', 'Professional Makeup Certification - Inspire', 'Entry-level professional makeup artistry', 'Makeup Artistry', 40, 365, 584, 60, 'https://www.miladytraining.com/courses/ultimate-face-inspire-course', true),
  (milady_id, 'MILADY-MAKEUP-PROTEGE', 'Professional Makeup Certification - Protégé', 'Advanced professional makeup artistry', 'Makeup Artistry', 60, 500, 800, 60, 'https://www.miladytraining.com/courses/ultimate-face-protege-course', true),
  
  -- Master Educator
  (milady_id, 'MILADY-EDUCATOR-L1', 'Master Educator Level 1', 'Beauty instructor certification level 1', 'Instructor Training', 80, 489, 782, 60, 'https://www.miladytraining.com/bundles/master-educator-level-1', true),
  (milady_id, 'MILADY-EDUCATOR-L2', 'Master Educator Level 2', 'Beauty instructor certification level 2', 'Instructor Training', 40, 245, 392, 60, 'https://www.miladytraining.com/bundles/master-educator-level-2', true),
  (milady_id, 'MILADY-EDUCATOR-L3', 'Master Educator Level 3', 'Beauty instructor certification level 3', 'Instructor Training', 40, 245, 392, 60, 'https://www.miladytraining.com/bundles/master-educator-level-3', true);

  -- ============================================================================
  -- JRI COURSES - Students enroll at jrihealthed.com
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, is_active) VALUES
  (jri_id, 'JRI-CCMA', 'Certified Clinical Medical Assistant (CCMA)', 'Clinical medical assistant certification', 'Medical Assistant', 120, 150, 225, 50, 'https://www.jrihealthed.com/medical-assistant', true),
  (jri_id, 'JRI-CPT', 'Certified Phlebotomy Technician (CPT)', 'Phlebotomy technician certification', 'Phlebotomy', 80, 150, 225, 50, 'https://www.jrihealthed.com/phlebotomy', true),
  (jri_id, 'JRI-CET', 'Certified EKG Technician (CET)', 'EKG technician certification', 'EKG/ECG', 60, 150, 225, 50, 'https://www.jrihealthed.com/ekg', true),
  (jri_id, 'JRI-CPHT', 'Certified Pharmacy Technician (CPhT)', 'Pharmacy technician certification', 'Pharmacy', 120, 200, 300, 50, 'https://www.jrihealthed.com/pharmacy-tech', true),
  (jri_id, 'JRI-CPCT', 'Certified Patient Care Technician (CPCT)', 'Patient care technician certification', 'Patient Care', 100, 180, 270, 50, 'https://www.jrihealthed.com/patient-care', true),
  (jri_id, 'JRI-CPC', 'Certified Professional Coder (CPC)', 'Medical billing and coding certification', 'Medical Billing & Coding', 160, 300, 450, 50, 'https://www.jrihealthed.com/medical-coding', true);

  -- ============================================================================
  -- NRF RISE UP COURSES - Students enroll at riseuptraining.org
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, is_active) VALUES
  (nrf_id, 'NRF-CS-FUND', 'Customer Service Fundamentals', 'Basic customer service skills', 'Customer Service', 4, 0, 0, 0, 'https://www.riseuptraining.org/courses', true),
  (nrf_id, 'NRF-CS-ADV', 'Advanced Customer Service', 'Advanced customer service techniques', 'Customer Service', 6, 25, 33, 30, 'https://www.riseuptraining.org/courses', true),
  (nrf_id, 'NRF-RETAIL-FUND', 'Retail Industry Fundamentals', 'Introduction to retail operations', 'Retail Operations', 4, 0, 0, 0, 'https://www.riseuptraining.org/courses', true),
  (nrf_id, 'NRF-SALES-FUND', 'Sales Fundamentals', 'Basic sales techniques', 'Sales', 4, 0, 0, 0, 'https://www.riseuptraining.org/courses', true),
  (nrf_id, 'NRF-SALES-ADV', 'Advanced Sales Techniques', 'Advanced selling strategies', 'Sales', 6, 25, 33, 30, 'https://www.riseuptraining.org/courses', true),
  (nrf_id, 'NRF-MGR', 'Store Manager Certification', 'Retail management certification', 'Management', 12, 50, 65, 30, 'https://www.riseuptraining.org/courses', true);

  -- ============================================================================
  -- CAREERSAFE COURSES - Students enroll at careersafeonline.com
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, is_active) VALUES
  (careersafe_id, 'CS-OSHA10-GI', 'OSHA 10-Hour General Industry', 'OSHA 10-hour safety certification for general industry', 'OSHA Safety', 10, 25, 35, 40, 'https://www.careersafeonline.com/osha-10-general-industry', true),
  (careersafe_id, 'CS-OSHA10-CONST', 'OSHA 10-Hour Construction', 'OSHA 10-hour safety certification for construction', 'OSHA Safety', 10, 25, 35, 40, 'https://www.careersafeonline.com/osha-10-construction', true),
  (careersafe_id, 'CS-OSHA30-GI', 'OSHA 30-Hour General Industry', 'OSHA 30-hour safety certification for general industry', 'OSHA Safety', 30, 45, 63, 40, 'https://www.careersafeonline.com/osha-30-general-industry', true),
  (careersafe_id, 'CS-OSHA30-CONST', 'OSHA 30-Hour Construction', 'OSHA 30-hour safety certification for construction', 'OSHA Safety', 30, 45, 63, 40, 'https://www.careersafeonline.com/osha-30-construction', true),
  (careersafe_id, 'CS-FORKLIFT', 'Forklift Safety Certification', 'OSHA-compliant forklift operator training', 'Equipment Safety', 4, 35, 49, 40, 'https://www.careersafeonline.com/forklift-safety', true),
  (careersafe_id, 'CS-HAZCOM', 'Hazard Communication (HazCom)', 'Chemical safety and GHS compliance', 'Workplace Safety', 3, 30, 42, 40, 'https://www.careersafeonline.com/hazcom', true);

  -- ============================================================================
  -- NATIONAL DRUG SCREENING COURSES - Students enroll at nationaldrugscreening.com
  -- ============================================================================
  
  INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, course_url, is_active) VALUES
  (nds_id, 'NDS-DOT-URINE', 'DOT Urine Specimen Collector', 'DOT-compliant urine specimen collection', 'Drug Testing', 8, 75, 113, 50, 'https://www.nationaldrugscreening.com/training-consulting/', true),
  (nds_id, 'NDS-BAT', 'Breath Alcohol Technician (BAT)', 'DOT breath alcohol testing certification', 'Drug Testing', 8, 85, 128, 50, 'https://www.nationaldrugscreening.com/training-consulting/', true),
  (nds_id, 'NDS-COMPLIANCE', 'Drug Testing Compliance Officer', 'Workplace drug testing compliance', 'Drug Testing', 16, 150, 225, 50, 'https://www.nationaldrugscreening.com/training-consulting/', true),
  (nds_id, 'NDS-WORKPLACE', 'Workplace Drug Testing Administrator', 'Administer workplace drug testing programs', 'Workplace Safety', 12, 125, 188, 50, 'https://www.nationaldrugscreening.com/training-consulting/', true);

  RAISE NOTICE 'Inserted 50+ courses with external enrollment links';
  RAISE NOTICE 'Students will be redirected to partner sites to complete enrollment';

END $$;
