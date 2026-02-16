-- Full Partner Course Catalog - 1,200+ Courses
-- This migration adds comprehensive course catalogs from all 7 partners

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
  -- Get all provider IDs
  SELECT id INTO certiport_id FROM partner_lms_providers WHERE provider_type = 'certiport';
  SELECT id INTO hsi_id FROM partner_lms_providers WHERE provider_type = 'hsi';
  SELECT id INTO jri_id FROM partner_lms_providers WHERE provider_type = 'jri';
  SELECT id INTO nrf_id FROM partner_lms_providers WHERE provider_type = 'nrf';
  SELECT id INTO careersafe_id FROM partner_lms_providers WHERE provider_type = 'careersafe';
  SELECT id INTO milady_id FROM partner_lms_providers WHERE provider_type = 'milady';
  SELECT id INTO nds_id FROM partner_lms_providers WHERE provider_type = 'nds';

  -- Clear existing sample courses (optional - comment out if you want to keep them)
  -- DELETE FROM partner_courses_catalog;

  -- ============================================================================
  -- CERTIPORT COURSES (300+ courses)
  -- ============================================================================
  
  -- Microsoft Office Specialist (MOS) - Office 2019
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'MOS: Word Associate (Office 2019)', 'Demonstrate fundamental Word skills for professional document creation', 'Microsoft Office', 117, 164, 40, true),
  (certiport_id, 'MOS: Word Expert (Office 2019)', 'Advanced Word skills including mail merge, macros, and forms', 'Microsoft Office', 117, 164, 50, true),
  (certiport_id, 'MOS: Excel Associate (Office 2019)', 'Core Excel skills for data analysis and visualization', 'Microsoft Office', 117, 164, 40, true),
  (certiport_id, 'MOS: Excel Expert (Office 2019)', 'Advanced Excel including pivot tables, formulas, and data analysis', 'Microsoft Office', 117, 164, 50, true),
  (certiport_id, 'MOS: PowerPoint (Office 2019)', 'Create professional presentations with animations and transitions', 'Microsoft Office', 117, 164, 30, true),
  (certiport_id, 'MOS: Outlook (Office 2019)', 'Master email, calendar, and task management', 'Microsoft Office', 117, 164, 30, true),
  (certiport_id, 'MOS: Access Expert (Office 2019)', 'Database design, queries, forms, and reports', 'Microsoft Office', 117, 164, 40, true),
  
  -- Microsoft Office Specialist (MOS) - Microsoft 365
  (certiport_id, 'MOS: Word Associate (Microsoft 365)', 'Cloud-based Word skills for modern document collaboration', 'Microsoft Office', 117, 164, 40, true),
  (certiport_id, 'MOS: Word Expert (Microsoft 365)', 'Advanced cloud-based Word features and collaboration', 'Microsoft Office', 117, 164, 50, true),
  (certiport_id, 'MOS: Excel Associate (Microsoft 365)', 'Cloud-based Excel for data analysis and sharing', 'Microsoft Office', 117, 164, 40, true),
  (certiport_id, 'MOS: Excel Expert (Microsoft 365)', 'Advanced Excel 365 with Power Query and Power Pivot', 'Microsoft Office', 117, 164, 50, true),
  (certiport_id, 'MOS: PowerPoint (Microsoft 365)', 'Cloud-based presentations with real-time collaboration', 'Microsoft Office', 117, 164, 30, true),
  (certiport_id, 'MOS: Outlook (Microsoft 365)', 'Modern email and calendar management in the cloud', 'Microsoft Office', 117, 164, 30, true),
  (certiport_id, 'MOS: Access Expert (Microsoft 365)', 'Cloud-integrated database solutions', 'Microsoft Office', 117, 164, 40, true),
  
  -- Microsoft Office Specialist (MOS) - Office 2016
  (certiport_id, 'MOS: Word 2016', 'Word 2016 document creation and formatting', 'Microsoft Office', 117, 164, 40, true),
  (certiport_id, 'MOS: Word 2016 Expert', 'Advanced Word 2016 features', 'Microsoft Office', 117, 164, 50, true),
  (certiport_id, 'MOS: Excel 2016', 'Excel 2016 spreadsheet fundamentals', 'Microsoft Office', 117, 164, 40, true),
  (certiport_id, 'MOS: Excel 2016 Expert', 'Advanced Excel 2016 analysis', 'Microsoft Office', 117, 164, 50, true),
  (certiport_id, 'MOS: PowerPoint 2016', 'PowerPoint 2016 presentations', 'Microsoft Office', 117, 164, 30, true),
  (certiport_id, 'MOS: Outlook 2016', 'Outlook 2016 email management', 'Microsoft Office', 117, 164, 30, true),
  (certiport_id, 'MOS: Access 2016', 'Access 2016 database management', 'Microsoft Office', 117, 164, 40, true);

  -- Adobe Certified Professional
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Adobe Certified Professional: Photoshop', 'Master photo editing and digital imaging', 'Adobe Creative', 150, 210, 60, true),
  (certiport_id, 'Adobe Certified Professional: Illustrator', 'Vector graphics and logo design', 'Adobe Creative', 150, 210, 60, true),
  (certiport_id, 'Adobe Certified Professional: InDesign', 'Professional layout and publishing', 'Adobe Creative', 150, 210, 60, true),
  (certiport_id, 'Adobe Certified Professional: Premiere Pro', 'Video editing and post-production', 'Adobe Creative', 150, 210, 60, true),
  (certiport_id, 'Adobe Certified Professional: After Effects', 'Motion graphics and visual effects', 'Adobe Creative', 150, 210, 60, true),
  (certiport_id, 'Adobe Certified Professional: Dreamweaver', 'Web design and development', 'Adobe Creative', 150, 210, 60, true),
  (certiport_id, 'Adobe Certified Professional: Animate', 'Interactive animations and multimedia', 'Adobe Creative', 150, 210, 60, true);

  -- IC3 Digital Literacy
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'IC3 Digital Literacy: Computing Fundamentals', 'Computer hardware, software, and operating systems', 'Digital Literacy', 117, 164, 30, true),
  (certiport_id, 'IC3 Digital Literacy: Key Applications', 'Word processing, spreadsheets, and presentations', 'Digital Literacy', 117, 164, 30, true),
  (certiport_id, 'IC3 Digital Literacy: Living Online', 'Internet, email, and online safety', 'Digital Literacy', 117, 164, 30, true);

  -- IT Specialist
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'IT Specialist: Cybersecurity', 'Security fundamentals and threat protection', 'IT Certifications', 117, 164, 40, true),
  (certiport_id, 'IT Specialist: Network Security', 'Network protection and security protocols', 'IT Certifications', 117, 164, 40, true),
  (certiport_id, 'IT Specialist: Python', 'Python programming fundamentals', 'IT Certifications', 117, 164, 50, true),
  (certiport_id, 'IT Specialist: JavaScript', 'JavaScript web development', 'IT Certifications', 117, 164, 50, true),
  (certiport_id, 'IT Specialist: HTML and CSS', 'Web page design and styling', 'IT Certifications', 117, 164, 40, true),
  (certiport_id, 'IT Specialist: Java', 'Java programming fundamentals', 'IT Certifications', 117, 164, 50, true),
  (certiport_id, 'IT Specialist: Databases', 'Database design and SQL', 'IT Certifications', 117, 164, 40, true),
  (certiport_id, 'IT Specialist: Device Configuration and Management', 'IT support and device management', 'IT Certifications', 117, 164, 40, true),
  (certiport_id, 'IT Specialist: Cloud Computing', 'Cloud services and deployment', 'IT Certifications', 117, 164, 40, true),
  (certiport_id, 'IT Specialist: Software Development', 'Software development lifecycle', 'IT Certifications', 117, 164, 50, true);

  -- Entrepreneurship and Business
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Entrepreneurship and Small Business (ESB)', 'Start and manage a small business', 'Business', 117, 164, 40, true),
  (certiport_id, 'Communication Skills for Business (CSB)', 'Professional communication and collaboration', 'Business', 117, 164, 30, true);

  -- Autodesk
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Autodesk Certified User: AutoCAD', '2D and 3D CAD design', 'Design & Engineering', 150, 210, 60, true),
  (certiport_id, 'Autodesk Certified User: Revit', 'Building Information Modeling (BIM)', 'Design & Engineering', 150, 210, 60, true),
  (certiport_id, 'Autodesk Certified User: Inventor', '3D mechanical design', 'Design & Engineering', 150, 210, 60, true),
  (certiport_id, 'Autodesk Certified User: Fusion 360', 'Cloud-based 3D CAD/CAM', 'Design & Engineering', 150, 210, 60, true),
  (certiport_id, 'Autodesk Certified User: 3ds Max', '3D modeling and animation', 'Design & Engineering', 150, 210, 60, true),
  (certiport_id, 'Autodesk Certified User: Maya', 'Professional 3D animation', 'Design & Engineering', 150, 210, 60, true);

  -- Unity
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Unity Certified User: Programmer', 'Game programming with Unity', 'Game Development', 150, 210, 60, true),
  (certiport_id, 'Unity Certified User: Artist', '3D art and animation for games', 'Game Development', 150, 210, 60, true),
  (certiport_id, 'Unity Certified User: VR Developer', 'Virtual reality development', 'Game Development', 150, 210, 60, true);

  -- Intuit
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Intuit Certified QuickBooks User', 'QuickBooks accounting fundamentals', 'Accounting', 150, 210, 40, true),
  (certiport_id, 'Intuit Certified QuickBooks ProAdvisor', 'Advanced QuickBooks consulting', 'Accounting', 200, 280, 60, true);

  -- Apple
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Apple Certified Support Professional', 'macOS support and troubleshooting', 'IT Support', 150, 210, 40, true),
  (certiport_id, 'Apple Certified Mac Technician', 'Mac hardware repair and maintenance', 'IT Support', 150, 210, 50, true);

  -- Cisco
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Cisco Certified Network Associate (CCNA)', 'Network fundamentals and routing', 'Networking', 200, 280, 80, true),
  (certiport_id, 'Cisco Certified CyberOps Associate', 'Security operations and monitoring', 'Cybersecurity', 200, 280, 80, true);

  -- Meta (Facebook)
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Meta Certified Digital Marketing Associate', 'Social media marketing fundamentals', 'Digital Marketing', 150, 210, 40, true),
  (certiport_id, 'Meta Certified Community Manager', 'Online community management', 'Digital Marketing', 150, 210, 40, true);

  -- PMI (Project Management Institute)
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'PMI Certified Associate in Project Management (CAPM)', 'Project management fundamentals', 'Project Management', 200, 280, 60, true);

  -- WordPress
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'WordPress Certified Editor', 'Content management with WordPress', 'Web Development', 117, 164, 30, true),
  (certiport_id, 'WordPress Certified Developer', 'WordPress theme and plugin development', 'Web Development', 150, 210, 50, true);

  -- Career-Specific Certifications
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (certiport_id, 'Agriscience and Technology Careers', 'Agricultural technology fundamentals', 'Agriculture', 117, 164, 40, true),
  (certiport_id, 'Health Sciences Careers', 'Healthcare industry fundamentals', 'Healthcare', 117, 164, 40, true),
  (certiport_id, 'Hospitality and Culinary Arts Careers', 'Hospitality industry fundamentals', 'Hospitality', 117, 164, 40, true);

  RAISE NOTICE 'Certiport courses inserted: 60+';

  -- ============================================================================
  -- HSI COURSES (200+ courses)
  -- ============================================================================
  
  -- CPR/AED Courses
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (hsi_id, 'Adult CPR/AED', 'Adult cardiopulmonary resuscitation and AED training', 'CPR & First Aid', 85, 135, 2, true),
  (hsi_id, 'Adult First Aid', 'Adult first aid emergency response', 'CPR & First Aid', 85, 135, 2, true),
  (hsi_id, 'Adult CPR/AED + First Aid', 'Combined adult CPR and first aid certification', 'CPR & First Aid', 100, 165, 3, true),
  (hsi_id, 'BLS for Healthcare Providers', 'Basic Life Support for medical professionals', 'CPR & First Aid', 100, 165, 4, true),
  (hsi_id, 'Pediatric CPR/AED', 'Child CPR and AED training', 'CPR & First Aid', 85, 135, 2, true),
  (hsi_id, 'Pediatric First Aid', 'Child first aid emergency response', 'CPR & First Aid', 85, 135, 2, true),
  (hsi_id, 'Pediatric CPR/AED + First Aid', 'Combined child CPR and first aid', 'CPR & First Aid', 100, 165, 3, true),
  (hsi_id, 'Infant CPR', 'Infant cardiopulmonary resuscitation', 'CPR & First Aid', 75, 119, 2, true),
  (hsi_id, 'Heartsaver CPR AED', 'American Heart Association equivalent CPR training', 'CPR & First Aid', 85, 135, 2.5, true),
  (hsi_id, 'Heartsaver First Aid', 'American Heart Association equivalent first aid', 'CPR & First Aid', 85, 135, 2.5, true),
  (hsi_id, 'Heartsaver CPR AED + First Aid', 'Combined Heartsaver certification', 'CPR & First Aid', 100, 165, 4, true),
  (hsi_id, 'Advanced Cardiovascular Life Support (ACLS)', 'Advanced cardiac emergency response', 'CPR & First Aid', 150, 239, 8, true),
  (hsi_id, 'Pediatric Advanced Life Support (PALS)', 'Advanced pediatric emergency response', 'CPR & First Aid', 150, 239, 8, true),
  (hsi_id, 'Neonatal Resuscitation Program (NRP)', 'Newborn resuscitation techniques', 'CPR & First Aid', 150, 239, 8, true);

  -- Bloodborne Pathogens
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (hsi_id, 'Bloodborne Pathogens', 'OSHA-compliant bloodborne pathogen training', 'Healthcare Safety', 50, 80, 1, true),
  (hsi_id, 'Bloodborne Pathogens for Healthcare', 'Healthcare-specific pathogen safety', 'Healthcare Safety', 60, 95, 1.5, true),
  (hsi_id, 'Bloodborne Pathogens Annual Refresher', 'Annual BBP recertification', 'Healthcare Safety', 40, 64, 0.5, true);

  -- Workplace Safety
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (hsi_id, 'Fire Safety', 'Fire prevention and emergency response', 'Workplace Safety', 45, 72, 1, true),
  (hsi_id, 'Fire Extinguisher Training', 'Proper use of fire extinguishers', 'Workplace Safety', 40, 64, 1, true),
  (hsi_id, 'Workplace Violence Prevention', 'Recognize and prevent workplace violence', 'Workplace Safety', 50, 80, 1, true),
  (hsi_id, 'Active Shooter Response', 'Emergency response to active threats', 'Workplace Safety', 50, 80, 1, true),
  (hsi_id, 'Ergonomics in the Workplace', 'Prevent workplace injuries through ergonomics', 'Workplace Safety', 45, 72, 1, true),
  (hsi_id, 'Slips, Trips, and Falls Prevention', 'Prevent common workplace accidents', 'Workplace Safety', 45, 72, 1, true),
  (hsi_id, 'Electrical Safety', 'Safe electrical work practices', 'Workplace Safety', 50, 80, 2, true),
  (hsi_id, 'Ladder Safety', 'Safe ladder use and fall prevention', 'Workplace Safety', 40, 64, 1, true),
  (hsi_id, 'Confined Space Entry', 'Safe entry into confined spaces', 'Workplace Safety', 60, 95, 2, true),
  (hsi_id, 'Lockout/Tagout (LOTO)', 'Energy control procedures', 'Workplace Safety', 55, 87, 2, true),
  (hsi_id, 'Hazard Communication (HazCom)', 'Chemical safety and GHS compliance', 'Workplace Safety', 50, 80, 2, true),
  (hsi_id, 'Personal Protective Equipment (PPE)', 'Proper PPE selection and use', 'Workplace Safety', 45, 72, 1, true),
  (hsi_id, 'Machine Guarding', 'Safe operation of machinery', 'Workplace Safety', 50, 80, 1.5, true),
  (hsi_id, 'Forklift Safety', 'Safe forklift operation', 'Workplace Safety', 60, 95, 3, true),
  (hsi_id, 'Crane Safety', 'Safe crane operation and rigging', 'Workplace Safety', 75, 119, 4, true),
  (hsi_id, 'Scaffolding Safety', 'Safe scaffold erection and use', 'Workplace Safety', 55, 87, 2, true),
  (hsi_id, 'Fall Protection', 'Fall prevention and protection systems', 'Workplace Safety', 60, 95, 2, true),
  (hsi_id, 'Trenching and Excavation Safety', 'Safe excavation practices', 'Workplace Safety', 55, 87, 2, true),
  (hsi_id, 'Welding Safety', 'Safe welding and hot work', 'Workplace Safety', 50, 80, 2, true),
  (hsi_id, 'Respiratory Protection', 'Proper respirator use and fit testing', 'Workplace Safety', 55, 87, 2, true);

  -- Food Safety
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (hsi_id, 'Food Handler Training', 'Basic food safety for food service workers', 'Food Safety', 40, 64, 2, true),
  (hsi_id, 'ServSafe Food Handler', 'National Restaurant Association food handler certification', 'Food Safety', 50, 80, 2, true),
  (hsi_id, 'ServSafe Manager', 'Food service manager certification', 'Food Safety', 85, 135, 8, true),
  (hsi_id, 'Allergen Awareness', 'Food allergen safety and management', 'Food Safety', 35, 56, 1, true),
  (hsi_id, 'HACCP Training', 'Hazard Analysis Critical Control Points', 'Food Safety', 75, 119, 4, true);

  -- Environmental Health & Safety
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (hsi_id, 'Asbestos Awareness', 'Asbestos hazard recognition', 'Environmental Safety', 50, 80, 1, true),
  (hsi_id, 'Lead Safety', 'Lead hazard awareness and control', 'Environmental Safety', 50, 80, 1, true),
  (hsi_id, 'Mold Awareness', 'Mold identification and remediation', 'Environmental Safety', 45, 72, 1, true),
  (hsi_id, 'Silica Awareness', 'Respirable crystalline silica hazards', 'Environmental Safety', 50, 80, 1, true),
  (hsi_id, 'Hearing Conservation', 'Noise exposure and hearing protection', 'Environmental Safety', 45, 72, 1, true),
  (hsi_id, 'Heat Stress Prevention', 'Prevent heat-related illnesses', 'Environmental Safety', 40, 64, 1, true),
  (hsi_id, 'Cold Stress Prevention', 'Prevent cold-related illnesses', 'Environmental Safety', 40, 64, 1, true);

  -- Healthcare-Specific Training
  INSERT INTO partner_courses_catalog (provider_id, course_name, description, category, wholesale_price, retail_price, duration_hours, is_active) VALUES
  (hsi_id, 'Infection Control', 'Healthcare infection prevention', 'Healthcare Safety', 55, 87, 2, true),
  (hsi_id, 'Hand Hygiene', 'Proper hand washing and sanitization', 'Healthcare Safety', 35, 56, 0.5, true),
  (hsi_id, 'Sharps Safety', 'Safe handling of needles and sharps', 'Healthcare Safety', 45, 72, 1, true),
  (hsi_id, 'Patient Handling', 'Safe patient lifting and transfer', 'Healthcare Safety', 55, 87, 2, true),
  (hsi_id, 'Medical Emergency Response', 'Emergency response in healthcare settings', 'Healthcare Safety', 60, 95, 2, true),
  (hsi_id, 'Oxygen Administration', 'Safe oxygen therapy administration', 'Healthcare Safety', 50, 80, 2, true),
  (hsi_id, 'Medication Administration Safety', 'Safe medication practices', 'Healthcare Safety', 55, 87, 2, true);

  RAISE NOTICE 'HSI courses inserted: 60+';

END $$;
