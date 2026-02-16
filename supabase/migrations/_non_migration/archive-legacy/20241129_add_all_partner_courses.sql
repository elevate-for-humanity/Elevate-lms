-- ============================================================================
-- ADD ALL 1200+ PARTNER COURSES WITH MARKUP PRICING
-- All 7 partners: Milady, Certiport, HSI, JRI, NRF, CareerSafe, NDS
-- ============================================================================

-- Create partner courses table if not exists
CREATE TABLE IF NOT EXISTS partner_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_hours DECIMAL(5,2),
  wholesale_cost DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  markup_percentage DECIMAL(5,2),
  profit_margin DECIMAL(10,2),
  course_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, course_code)
);

CREATE INDEX IF NOT EXISTS idx_partner_courses_partner ON partner_courses(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_courses_category ON partner_courses(category);
CREATE INDEX IF NOT EXISTS idx_partner_courses_active ON partner_courses(is_active);

-- ============================================================================
-- MILADY COURSES (76 total)
-- ============================================================================

-- Milady CIMA Full Curriculum (7 programs)
INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'CIMA-COSMO', 'Cosmetology Full Curriculum', '1500-hour complete cosmetology program with built-in time tracking', 'Full Curriculum', 1500, 300.00, 499.99, 66.66, 199.99),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'CIMA-BARBER', 'Barbering Full Curriculum', '1500-2000 hour barbering program with built-in time tracking', 'Full Curriculum', 1750, 300.00, 499.99, 66.66, 199.99),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'CIMA-ESTH', 'Esthetics Full Curriculum', '600-hour esthetics program with built-in time tracking', 'Full Curriculum', 600, 200.00, 349.99, 75.00, 149.99),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'CIMA-NAIL', 'Nail Technology Full Curriculum', '600-hour nail technology program', 'Full Curriculum', 600, 200.00, 349.99, 75.00, 149.99),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'CIMA-MASSAGE', 'Massage Therapy Full Curriculum', 'Complete massage therapy program', 'Full Curriculum', 800, 250.00, 399.99, 60.00, 149.99),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'CIMA-INSTRUCTOR', 'Student Instructor Program', 'Instructor training and certification', 'Full Curriculum', 400, 200.00, 349.99, 75.00, 149.99),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'CIMA-ADV-ESTH', 'Advanced Esthetics', 'Advanced esthetics procedures and techniques', 'Full Curriculum', 600, 200.00, 349.99, 75.00, 149.99)
ON CONFLICT (partner_id, course_code) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  wholesale_cost = EXCLUDED.wholesale_cost,
  retail_price = EXCLUDED.retail_price,
  updated_at = NOW();

-- Milady RISE Certifications (3 courses)
INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'RISE-WELLBEING', 'Client Well-Being & Safety Certification', 'Human trafficking, domestic violence, infection control', 'Safety', 3.5, 29.95, 39.95, 33.39, 10.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'RISE-FINANCE', 'Finance Fundamentals Certification', 'Business finance and management skills', 'Business', 4, 99.95, 129.95, 30.02, 30.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'milady'), 'RISE-EDUCATOR', 'RISE Educator Program', '6-month instructor training program', 'Education', 180, 599.99, 749.99, 25.00, 150.00)
ON CONFLICT (partner_id, course_code) DO NOTHING;

-- Note: Additional 66 Milady micro-credentials to be added via bulk import
-- Categories: Safety (4), Business (11), Technical (15), Nail (3), Instructor (28), Webinars (4)

-- ============================================================================
-- CERTIPORT CERTIFICATIONS (28 programs)
-- ============================================================================

INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'MOS-WORD', 'Microsoft Office Specialist - Word', 'Industry-recognized Word certification', 'Technology', 8, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'MOS-EXCEL', 'Microsoft Office Specialist - Excel', 'Industry-recognized Excel certification', 'Technology', 8, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'MOS-PPT', 'Microsoft Office Specialist - PowerPoint', 'PowerPoint certification', 'Technology', 8, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'MOS-OUTLOOK', 'Microsoft Office Specialist - Outlook', 'Outlook certification', 'Technology', 8, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'MOS-ACCESS', 'Microsoft Office Specialist - Access', 'Access database certification', 'Technology', 8, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'ADOBE-PS', 'Adobe Certified Professional - Photoshop', 'Photoshop certification', 'Design', 10, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'ADOBE-AI', 'Adobe Certified Professional - Illustrator', 'Illustrator certification', 'Design', 10, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'IC3-DIGITAL', 'IC3 Digital Literacy Certification', 'Computer fundamentals certification', 'Technology', 8, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'ESB-CERT', 'Entrepreneurship & Small Business', 'Business fundamentals certification', 'Business', 8, 120.00, 179.95, 49.96, 59.95),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'), 'CSB-CERT', 'Communication Skills for Business', 'Professional communication certification', 'Business', 6, 120.00, 179.95, 49.96, 59.95)
ON CONFLICT (partner_id, course_code) DO NOTHING;

-- Note: Additional 18 Certiport certifications to be added

-- ============================================================================
-- HSI COURSES (1000+ courses - Sample categories)
-- ============================================================================

-- HSI CPR/First Aid (10 core courses)
INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'hsi'), 'HSI-CPR-ADULT', 'CPR/AED for Adults', 'Adult CPR and AED training', 'Healthcare', 3, 75.00, 119.00, 58.67, 44.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'hsi'), 'HSI-CPR-ALL', 'CPR/AED Adults, Children & Infants', 'Comprehensive CPR training', 'Healthcare', 4, 85.00, 135.00, 58.82, 50.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'hsi'), 'HSI-FIRST-AID', 'First Aid', 'Basic first aid training', 'Healthcare', 4, 75.00, 119.00, 58.67, 44.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'hsi'), 'HSI-CPR-FA', 'CPR/AED + First Aid Combined', 'Complete emergency response', 'Healthcare', 5, 125.00, 189.00, 51.20, 64.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'hsi'), 'HSI-BBP', 'Bloodborne Pathogens', 'Bloodborne pathogen safety', 'Safety', 1, 45.00, 69.00, 53.33, 24.00)
ON CONFLICT (partner_id, course_code) DO NOTHING;

-- Note: HSI has 1000+ additional courses across 10 categories
-- To be imported via bulk data load from HSI course catalog

-- ============================================================================
-- JRI PROGRAMS (8 certifications - FREE wholesale)
-- ============================================================================

INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'jri'), 'JRI-CCT1', 'Certified Custodial Technician Level 1', 'Entry-level janitorial certification', 'Janitorial', 40, 0.00, 249.00, 0, 249.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'jri'), 'JRI-CCT2', 'Certified Custodial Technician Level 2', 'Intermediate janitorial certification', 'Janitorial', 40, 0.00, 299.00, 0, 299.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'jri'), 'JRI-CCS', 'Certified Custodial Supervisor', 'Supervisory certification', 'Janitorial', 40, 0.00, 349.00, 0, 349.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'jri'), 'JRI-GREEN', 'Green Cleaning Fundamentals', 'Sustainable cleaning practices', 'Janitorial', 8, 0.00, 149.00, 0, 149.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'jri'), 'JRI-FLOOR', 'Floor Care Specialist', 'Floor maintenance certification', 'Janitorial', 16, 0.00, 199.00, 0, 199.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'jri'), 'JRI-CARPET', 'Carpet Care Specialist', 'Carpet cleaning certification', 'Janitorial', 16, 0.00, 199.00, 0, 199.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'jri'), 'JRI-RESTROOM', 'Restroom Sanitation Specialist', 'Restroom cleaning certification', 'Janitorial', 8, 0.00, 149.00, 0, 149.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'jri'), 'JRI-INFECTION', 'Infection Control for Custodians', 'Healthcare facility cleaning', 'Janitorial', 8, 0.00, 149.00, 0, 149.00)
ON CONFLICT (partner_id, course_code) DO NOTHING;

-- ============================================================================
-- NRF RISE UP (10 courses - FREE wholesale)
-- ============================================================================

INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-CS-FUND', 'Customer Service Fundamentals', 'Basic customer service skills', 'Retail', 4, 0.00, 149.00, 0, 149.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-CS-ADV', 'Advanced Customer Service', 'Advanced service techniques', 'Retail', 6, 0.00, 199.00, 0, 199.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-SALES', 'Retail Sales Fundamentals', 'Sales skills and techniques', 'Retail', 4, 0.00, 149.00, 0, 149.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-VISUAL', 'Visual Merchandising', 'Store display and merchandising', 'Retail', 4, 0.00, 149.00, 0, 149.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-INVENTORY', 'Inventory Management', 'Stock and inventory control', 'Retail', 4, 0.00, 149.00, 0, 149.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-LOSS', 'Loss Prevention', 'Theft prevention and security', 'Retail', 3, 0.00, 129.00, 0, 129.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-MGMT', 'Retail Management Fundamentals', 'Store management skills', 'Retail', 8, 0.00, 249.00, 0, 249.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-LEAD', 'Team Leadership', 'Leadership and team building', 'Retail', 6, 0.00, 199.00, 0, 199.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-OPS', 'Store Operations', 'Daily store operations', 'Retail', 8, 0.00, 249.00, 0, 249.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nrf_rise'), 'NRF-DIFFICULT', 'Handling Difficult Customers', 'Conflict resolution skills', 'Retail', 2, 0.00, 99.00, 0, 99.00)
ON CONFLICT (partner_id, course_code) DO NOTHING;

-- ============================================================================
-- CAREERSAFE OSHA (11 courses)
-- ============================================================================

INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'OSHA-10-GEN', 'OSHA 10-Hour General Industry', 'OSHA 10 general industry certification', 'Safety', 10, 25.00, 59.00, 136.00, 34.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'OSHA-10-CON', 'OSHA 10-Hour Construction', 'OSHA 10 construction certification', 'Safety', 10, 25.00, 59.00, 136.00, 34.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'OSHA-30-GEN', 'OSHA 30-Hour General Industry', 'OSHA 30 general industry certification', 'Safety', 30, 75.00, 149.00, 98.67, 74.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'OSHA-30-CON', 'OSHA 30-Hour Construction', 'OSHA 30 construction certification', 'Safety', 30, 75.00, 149.00, 98.67, 74.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'CS-FORKLIFT', 'Forklift Operator Training', 'Forklift certification', 'Safety', 4, 45.00, 89.00, 97.78, 44.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'CS-HAZCOM', 'Hazard Communication', 'HazCom training', 'Safety', 2, 25.00, 45.00, 80.00, 20.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'CS-PPE', 'Personal Protective Equipment', 'PPE safety training', 'Safety', 1, 20.00, 35.00, 75.00, 15.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'CS-FALL', 'Fall Protection', 'Fall prevention training', 'Safety', 2, 30.00, 55.00, 83.33, 25.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'CS-ELECTRICAL', 'Electrical Safety', 'Electrical hazard training', 'Safety', 2, 30.00, 55.00, 83.33, 25.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'CS-CONFINED', 'Confined Space Entry', 'Confined space safety', 'Safety', 3, 40.00, 69.00, 72.50, 29.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'careersafe'), 'CS-LOTO', 'Lockout/Tagout', 'LOTO procedures', 'Safety', 2, 30.00, 55.00, 83.33, 25.00)
ON CONFLICT (partner_id, course_code) DO NOTHING;

-- ============================================================================
-- NATIONAL DRUG SCREENING (27 services)
-- ============================================================================

-- Drug Testing Services (8)
INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-5PANEL', '5-Panel Urine Drug Test', 'Standard 5-panel drug screening', 'Drug Testing', 0.5, 50.00, 79.00, 58.00, 29.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-10PANEL', '10-Panel Urine Drug Test', 'Comprehensive 10-panel screening', 'Drug Testing', 0.5, 60.00, 99.00, 65.00, 39.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-DOT', 'DOT 5-Panel Drug Test', 'DOT-compliant drug test', 'Drug Testing', 0.5, 55.00, 89.00, 61.82, 34.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-ORAL', 'Oral Fluid Drug Test', 'Saliva-based drug test', 'Drug Testing', 0.5, 55.00, 89.00, 61.82, 34.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-HAIR', 'Hair Drug Test', 'Hair follicle drug test', 'Drug Testing', 0.5, 100.00, 149.00, 49.00, 49.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-FENTANYL', 'Fentanyl Drug Test', 'Fentanyl-specific test', 'Drug Testing', 0.5, 65.00, 99.00, 52.31, 34.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-ETG', 'EtG Alcohol Test', 'Alcohol metabolite test', 'Drug Testing', 0.5, 50.00, 79.00, 58.00, 29.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-BREATH', 'Breath Alcohol Test', 'Breathalyzer test', 'Drug Testing', 0.25, 30.00, 49.00, 63.33, 19.00)
ON CONFLICT (partner_id, course_code) DO NOTHING;

-- Training Courses (11)
INSERT INTO partner_courses (partner_id, course_code, course_name, description, category, duration_hours, wholesale_cost, retail_price, markup_percentage, profit_margin) VALUES
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-TRAIN-DOT', 'DOT Urine Specimen Collector Training', 'DOT collector certification', 'Compliance Training', 2, 99.00, 149.00, 50.51, 50.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-TRAIN-ORAL', 'DOT Oral Fluid Collector Training', 'Oral fluid collector training', 'Compliance Training', 2, 99.00, 149.00, 50.51, 50.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-TRAIN-DER', 'Designated Employer Representative Training', 'DER certification', 'Compliance Training', 2, 99.00, 149.00, 50.51, 50.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-TRAIN-SUPER', 'Supervisor Reasonable Suspicion Training', 'Supervisor drug awareness', 'Compliance Training', 2, 99.00, 149.00, 50.51, 50.00),
((SELECT id FROM partner_lms_providers WHERE provider_type = 'nds'), 'NDS-TRAIN-BAT', 'Breath Alcohol Technician Training', 'BAT certification', 'Compliance Training', 4, 149.00, 249.00, 67.11, 100.00)
ON CONFLICT (partner_id, course_code) DO NOTHING;

-- ============================================================================
-- CREATE VIEWS FOR EASY QUERYING
-- ============================================================================

CREATE OR REPLACE VIEW partner_courses_catalog AS
SELECT 
  pc.id,
  pc.course_code,
  pc.course_name,
  pc.description,
  pc.category,
  pc.duration_hours,
  pc.wholesale_cost,
  pc.retail_price,
  pc.markup_percentage,
  pc.profit_margin,
  pc.is_active,
  p.provider_name,
  p.provider_type
FROM partner_courses pc
JOIN partner_lms_providers p ON pc.partner_id = p.id
WHERE pc.is_active = true
ORDER BY p.provider_name, pc.category, pc.course_name;

-- Grant permissions
GRANT SELECT ON partner_courses TO authenticated;
GRANT SELECT ON partner_courses_catalog TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Partner courses migration complete!';
  RAISE NOTICE '   - Sample courses added for all 7 partners';
  RAISE NOTICE '   - Total courses in system: %', (SELECT COUNT(*) FROM partner_courses);
  RAISE NOTICE '   - Ready for bulk import of remaining courses';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Course breakdown:';
  RAISE NOTICE '   - Milady: 10 courses (66 more to add)';
  RAISE NOTICE '   - Certiport: 10 courses (18 more to add)';
  RAISE NOTICE '   - HSI: 5 courses (995+ more to add)';
  RAISE NOTICE '   - JRI: 8 courses (complete)';
  RAISE NOTICE '   - NRF: 10 courses (complete)';
  RAISE NOTICE '   - CareerSafe: 11 courses (complete)';
  RAISE NOTICE '   - NDS: 13 courses (14 more to add)';
END $$;
