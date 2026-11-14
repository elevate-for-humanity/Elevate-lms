-- Fix truncated short_description values on programs that were cut off mid-sentence.
-- Descriptions sourced from canonical static program files in data/programs/.

UPDATE public.programs
SET short_description = 'Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks. Help others overcome addiction and mental health challenges.'
WHERE slug = 'certified-recovery-specialist'
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 80);

UPDATE public.programs
SET short_description = 'Earn OSHA-compliant forklift operator certification in 1 week. Hands-on training on sit-down, stand-up, and reach truck forklifts.'
WHERE slug IN ('forklift', 'forklift-operator', 'ai-forklift-safety-certification-1774495387731')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Earn your IRS PTIN and learn individual and small business tax preparation. 8-week program with real tax software training.'
WHERE slug IN ('tax-preparation', 'tax-prep')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Complete 120 hours of classroom and clinical training in 4 weeks. Prepare for the NHA Certified Phlebotomy Technician (CPT) exam and enter healthcare within a month.'
WHERE slug IN ('phlebotomy', 'phlebotomy-technician', 'phlebotomy-technician-program', 'nha-phlebotomy')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Earn your Indiana Certified Peer Recovery Specialist (CPRS) credential in 8 weeks. Help others overcome addiction and mental health challenges.'
WHERE slug IN ('peer-recovery-specialist', 'peer-recovery-specialist-jri', 'peer-support')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Indiana state CNA certification in 6 weeks. Clinical rotations at licensed healthcare facilities. State exam proctored on-site. FSSA IMPACT funding available for eligible participants.'
WHERE slug IN ('cna', 'cna-cert', 'cna-certification', 'cna-training')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Prepare for the CCMA certification exam. Clinical and administrative medical assisting skills in 12 weeks.'
WHERE slug IN ('medical-assistant', 'medical-assistant-program', 'nha-medical-assistant')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

UPDATE public.programs
SET short_description = 'Install, service, and repair heating and cooling systems. EPA 608 Universal certification proctored on-site. 6 weeks. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.'
WHERE slug IN ('hvac-technician', 'hvac', 'hvac-technician-program', 'hvac-2024')
  AND (short_description IS NULL OR short_description NOT LIKE '%.%' OR length(short_description) < 60);

-- Fix any remaining programs with descriptions that end mid-word (no terminal punctuation, under 100 chars)
-- These are caught by the programs page but the DB should be clean regardless.
UPDATE public.programs
SET short_description = NULL
WHERE short_description IS NOT NULL
  AND length(short_description) < 50
  AND short_description NOT LIKE '%.'
  AND short_description NOT LIKE '%!'
  AND short_description NOT LIKE '%?';
