-- Add NHA training partner programs to the programs table.
--
-- These are training + certification bundle programs sold through the NHA
-- training partner agreement. Separate from the testing center (exam proctoring).
--
-- Pricing comes from lib/testing/nha-pricing.ts at runtime — the total_cost
-- column here is the retail bundle price in dollars for Stripe checkout.
-- Update it when nha-pricing.ts changes.
--
-- Apply in Supabase Dashboard → SQL Editor.

INSERT INTO public.programs (
  slug,
  title,
  description,
  category,
  duration_weeks,
  total_cost,
  published,
  is_active,
  status,
  funding_eligible,
  credential,
  short_description
) VALUES
  (
    'nha-medical-assistant',
    'Medical Assistant Program',
    'Train for both clinical and administrative roles in healthcare settings. This program prepares you for certification and real-world job responsibilities. Includes exam prep, practice assessments, and learner support throughout.',
    'healthcare',
    16,
    919,    -- $919 retail bundle (from nha-pricing.ts medicalAssistant)
    true,
    true,
    'active',
    true,
    'CCMA — Certified Clinical Medical Assistant',
    'Clinical and administrative training with NHA CCMA certification prep included.'
  ),
  (
    'nha-pharmacy-technician',
    'Pharmacy Technician Program',
    'Prepare for a fast-growing role in pharmacies and healthcare facilities with certification-focused training and exam readiness. Includes PharmaSeer, exam prep, and learner support.',
    'healthcare',
    12,
    729,    -- $729 retail bundle (from nha-pricing.ts pharmacyTechnician)
    true,
    true,
    'active',
    true,
    'ExCPT — Certified Pharmacy Technician',
    'Pharmacy technician training with NHA ExCPT certification prep included.'
  ),
  (
    'nha-phlebotomy',
    'Phlebotomy Technician Program',
    'Learn essential blood collection and patient interaction skills while preparing for certification in a high-demand field. Includes study guide, practice test, exam prep, and certification attempt.',
    'healthcare',
    10,
    NULL,   -- a la carte only; no bundle. Enroll via contact/admissions.
    true,
    true,
    'active',
    true,
    'CPT — Certified Phlebotomy Technician',
    'Phlebotomy training with NHA CPT certification prep included.'
  ),
  (
    'nha-billing-coding',
    'Medical Billing & Coding Program',
    'Train for in-demand administrative healthcare roles with certification prep focused on insurance claims, coding, and documentation. Includes study guide, practice test, exam prep, and certification attempt.',
    'healthcare',
    12,
    NULL,   -- a la carte only; no bundle. Enroll via contact/admissions.
    true,
    true,
    'active',
    true,
    'CBCS — Certified Billing & Coding Specialist',
    'Medical billing and coding training with NHA CBCS certification prep included.'
  ),
  (
    'nha-patient-care-technician',
    'Patient Care Technician Program',
    'Comprehensive training for patient care roles in hospitals and clinical settings. Includes anatomy, medical terminology, PCT skills, and certification prep.',
    'healthcare',
    14,
    649,    -- $649 retail bundle (from nha-pricing.ts patientCareTechnician)
    true,
    true,
    'active',
    true,
    'CPCT/A — Certified Patient Care Technician',
    'Patient care technician training with NHA CPCT/A certification prep included.'
  ),
  (
    'nha-medical-admin-assistant',
    'Medical Administrative Assistant Program',
    'Train for front-office healthcare roles including scheduling, billing, and patient communication. Includes medical terminology, administrative skills, and certification prep.',
    'healthcare',
    10,
    449,    -- $449 retail bundle (from nha-pricing.ts medicalAdminAssistant)
    true,
    true,
    'active',
    true,
    'CMAA — Certified Medical Administrative Assistant',
    'Medical administrative training with NHA CMAA certification prep included.'
  ),
  (
    'nha-ehr',
    'Electronic Health Records Program',
    'Learn to manage patient records in digital health systems. Includes study guide, practice test, exam prep, and EHR certification attempt.',
    'healthcare',
    8,
    NULL,   -- a la carte only; no bundle.
    true,
    true,
    'active',
    false,  -- secondary program — not featured on public landing
    'CEHRS — Certified Electronic Health Records Specialist',
    'EHR training with NHA CEHRS certification prep included.'
  ),
  (
    'nha-ekg-technician',
    'EKG Technician Program',
    'Learn cardiac monitoring and EKG interpretation for clinical settings. Includes study guide, practice test, exam prep, and certification attempt.',
    'healthcare',
    8,
    NULL,   -- a la carte only; no bundle.
    true,
    true,
    'active',
    false,  -- secondary program — not featured on public landing
    'CET — Certified EKG Technician',
    'EKG technician training with NHA CET certification prep included.'
  )
ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  description       = EXCLUDED.description,
  total_cost        = EXCLUDED.total_cost,
  published         = EXCLUDED.published,
  is_active         = EXCLUDED.is_active,
  status            = EXCLUDED.status;
