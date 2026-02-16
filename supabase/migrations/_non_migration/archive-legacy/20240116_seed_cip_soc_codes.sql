-- Update existing programs with CIP/SOC codes and funding eligibility
-- This assumes programs exist with these titles. Adjust as needed.

-- 1. Barber Apprenticeship
UPDATE programs
SET 
  cip_code = '12.0402 – Barbering',
  soc_code = '39-5011 – Barbers',
  funding_eligibility = ARRAY['WIOA', 'Apprenticeship', 'SEAL', 'WRG-style']
WHERE title ILIKE '%barber%apprenticeship%';

-- 2. HVAC Technician
UPDATE programs
SET 
  cip_code = '47.0201 – Heating, Air Conditioning, Ventilation',
  soc_code = '49-9021 – HVAC Mechanics & Installers',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Youth', 'Reentry']
WHERE title ILIKE '%hvac%';

-- 3. CNA / Direct Support Professional
UPDATE programs
SET 
  cip_code = '51.2602 – Home Health / Health Services',
  soc_code = '31-1131 – Nursing Assistants',
  funding_eligibility = ARRAY['WIOA', 'SNAP/TANF', 'WRG-style', 'JRI']
WHERE title ILIKE '%cna%' OR title ILIKE '%direct support%';

-- 4. Emergency Health & Safety Technician
UPDATE programs
SET 
  cip_code = '43.9999 – Public Safety / Security',
  soc_code = '29-2040 – EMTs & Responders',
  funding_eligibility = ARRAY['JRI', 'Reentry', 'WIOA']
WHERE title ILIKE '%emergency health%' OR title ILIKE '%safety technician%';

-- 5. Tax Preparation & Financial Services
UPDATE programs
SET 
  cip_code = '52.0301 – Accounting Technology',
  soc_code = '13-2082 – Tax Preparers',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Youth', 'Reentry']
WHERE title ILIKE '%tax preparation%' OR title ILIKE '%financial services%';

-- 6. Business Start-Up & Marketing
UPDATE programs
SET 
  cip_code = '52.0703 – Entrepreneurship / Small Business',
  soc_code = '11-1021 – General Managers',
  funding_eligibility = ARRAY['WIOA Youth', 'Reentry', 'TANF']
WHERE title ILIKE '%business start%' OR title ILIKE '%marketing%';

-- 7. Beauty & Career Educator / Esthetics
UPDATE programs
SET 
  cip_code = '12.0401 – Cosmetology',
  soc_code = '39-5094 – Skincare Specialists',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Apprenticeship-bridge']
WHERE title ILIKE '%beauty%educator%' OR title ILIKE '%career educator%';

-- 8. Professional Esthetician
UPDATE programs
SET 
  cip_code = '12.0409 – Aesthetician/Esthetician',
  soc_code = '39-5094 – Skincare Specialists',
  funding_eligibility = ARRAY['WIOA', 'WRG-style']
WHERE title ILIKE '%professional esthetician%' OR (title ILIKE '%esthetician%' AND title NOT ILIKE '%beauty%');

-- 9. Public Safety Reentry Specialist
UPDATE programs
SET 
  cip_code = '43.9999 – Security / Public Safety',
  soc_code = '21-1099 – Community & Social Service Specialists',
  funding_eligibility = ARRAY['JRI', 'WIOA', 'Reentry', 'EDRC']
WHERE title ILIKE '%public safety%reentry%' OR title ILIKE '%reentry specialist%';

-- 10. Medical Assistant (MA)
UPDATE programs
SET 
  cip_code = '51.0801 – Medical Assisting',
  soc_code = '31-9092 – Medical Assistants',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Youth', 'Reentry']
WHERE title ILIKE '%medical assistant%' AND title NOT ILIKE '%clinical%' AND title NOT ILIKE '%administrative%';

-- 11. Phlebotomy Technician
UPDATE programs
SET 
  cip_code = '51.1009 – Phlebotomy Technician',
  soc_code = '31-9097 – Phlebotomists',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Healthcare']
WHERE title ILIKE '%phlebotomy%';

-- 12. EKG Technician
UPDATE programs
SET 
  cip_code = '51.0901 – Cardiovascular Technology',
  soc_code = '29-2031 – Cardiovascular Technologists',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Healthcare']
WHERE title ILIKE '%ekg%' OR title ILIKE '%ecg%';

-- 13. Patient Care Technician (PCT)
UPDATE programs
SET 
  cip_code = '51.0808 – Veterinary/Animal Health Technology',
  soc_code = '31-9099 – Healthcare Support Workers',
  funding_eligibility = ARRAY['WIOA', 'SNAP/TANF', 'WRG-style']
WHERE title ILIKE '%patient care technician%' OR title ILIKE '%pct%';

-- 14. Pharmacy Technician
UPDATE programs
SET 
  cip_code = '51.0805 – Pharmacy Technician',
  soc_code = '29-2052 – Pharmacy Technicians',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Healthcare']
WHERE title ILIKE '%pharmacy%';

-- 15. Clinical Medical Assistant
UPDATE programs
SET 
  cip_code = '51.0801 – Medical Assisting',
  soc_code = '31-9092 – Medical Assistants',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Youth', 'Reentry']
WHERE title ILIKE '%clinical%medical%assistant%';

-- 16. Administrative Medical Assistant
UPDATE programs
SET 
  cip_code = '51.0716 – Medical Administrative Assistant',
  soc_code = '43-6013 – Medical Secretaries',
  funding_eligibility = ARRAY['WIOA', 'WRG-style', 'Youth', 'Reentry']
WHERE title ILIKE '%administrative%medical%assistant%';

-- Verify the updates
SELECT 
  title,
  cip_code,
  soc_code,
  funding_eligibility
FROM programs
WHERE cip_code IS NOT NULL
ORDER BY title;
