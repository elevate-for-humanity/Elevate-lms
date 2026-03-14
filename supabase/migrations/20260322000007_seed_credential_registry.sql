-- =============================================================================
-- Seed credential_registry — workforce credentials for Elevate programs
--
-- Targets credential_registry (the real workforce table), NOT credentials
-- (the API keys table). These are two different tables.
--
-- Two credentials already exist in the live DB with correct data:
--   EPA Section 608  → d37ae8a2-9297-44d1-83db-fa7ef375b796
--   NCRC             → 3e4683f2-a977-4193-99d7-7b8d15270116
-- These rows are included in the ON CONFLICT DO UPDATE to keep them current.
--
-- The remaining 12 credentials are new inserts.
-- All IDs are deterministic so downstream FKs (program_credentials,
-- credential_exam_domains) can reference them by stable UUID.
--
-- Idempotent: ON CONFLICT (id) DO UPDATE on all rows.
-- =============================================================================

INSERT INTO public.credential_registry (
  id,
  name,
  abbreviation,
  description,
  issuer_type,
  issuing_authority,
  issuing_authority_url,
  proctor_authority,
  delivery,
  requires_exam,
  exam_type,
  passing_score,
  verification_source,
  renewal_period_months,
  wioa_eligible,
  dol_registered,
  is_active,
  is_published
)
VALUES

-- EPA Section 608 Universal (already in live DB — update to ensure fields are current)
('d37ae8a2-9297-44d1-83db-fa7ef375b796',
 'EPA Section 608 Universal', 'EPA-608',
 'Federal certification required to purchase and handle refrigerants. Universal covers all system types.',
 'elevate_proctored', 'U.S. Environmental Protection Agency', 'https://www.epa.gov/section608',
 'Elevate for Humanity', 'in_person',
 true, 'proctored_written', 70,
 'epa_direct', 36, true, false, true, true),

-- OSHA 10-Hour Construction
('00000000-0000-0000-0000-000000000102',
 'OSHA 10-Hour Construction', 'OSHA-10',
 'OSHA Outreach Training Program card for construction industry workers.',
 'partner_delivered', 'Occupational Safety and Health Administration', 'https://www.osha.gov',
 NULL, 'in_person',
 false, 'attendance', NULL,
 'osha_outreach', NULL, true, false, true, true),

-- ACT WorkKeys NCRC (already in live DB — update)
('3e4683f2-a977-4193-99d7-7b8d15270116',
 'WorkKeys National Career Readiness Certificate', 'NCRC',
 'ACT WorkKeys credential validating applied math, workplace documents, and business writing skills.',
 'elevate_proctored', 'ACT', 'https://www.act.org/content/act/en/products-and-services/workkeys-for-job-seekers/ncrc.html',
 'Elevate for Humanity', 'computer_based',
 true, 'computer_adaptive', 3,
 'act_registry', NULL, true, false, true, true),

-- Indiana Barber License
('00000000-0000-0000-0000-000000000104',
 'Indiana Barber License', 'IN-BARBER',
 'Indiana Professional Licensing Agency barber license. Required to practice barbering in Indiana.',
 'partner_delivered', 'Indiana Professional Licensing Agency', 'https://www.in.gov/pla/barbering-and-cosmetology/',
 NULL, 'in_person',
 true, 'state_board', 70,
 'indiana_pla', NULL, true, false, true, true),

-- Indiana Cosmetology License
('00000000-0000-0000-0000-000000000105',
 'Indiana Cosmetology License', 'IN-COSMO',
 'Indiana PLA cosmetology license. Required to practice cosmetology in Indiana.',
 'partner_delivered', 'Indiana Professional Licensing Agency', 'https://www.in.gov/pla/barbering-and-cosmetology/',
 NULL, 'in_person',
 true, 'state_board', 70,
 'indiana_pla', NULL, true, false, true, true),

-- Indiana Nail Technician License
('00000000-0000-0000-0000-000000000106',
 'Indiana Nail Technician License', 'IN-NAIL',
 'Indiana PLA nail technician license. Required to practice nail technology in Indiana.',
 'partner_delivered', 'Indiana Professional Licensing Agency', 'https://www.in.gov/pla/barbering-and-cosmetology/',
 NULL, 'in_person',
 true, 'state_board', 70,
 'indiana_pla', NULL, true, false, true, true),

-- Indiana CNA
('00000000-0000-0000-0000-000000000107',
 'Indiana Certified Nursing Assistant', 'IN-CNA',
 'Indiana State Department of Health CNA certification. Required for nursing assistant practice in Indiana.',
 'partner_delivered', 'Indiana State Department of Health', 'https://www.in.gov/isdh/',
 'Prometric', 'in_person',
 true, 'proctored_written_and_skills', 70,
 'indiana_nurse_aide_registry', NULL, true, false, true, true),

-- CDL Class A
('00000000-0000-0000-0000-000000000108',
 'CDL Class A Commercial Driver License', 'CDL-A',
 'Indiana BMV Class A CDL. Required to operate combination vehicles over 26,001 lbs.',
 'partner_delivered', 'Indiana Bureau of Motor Vehicles', 'https://www.in.gov/bmv/licenses-permits-ids/commercial-driver-license/',
 'Indiana BMV', 'in_person',
 true, 'knowledge_and_skills', 80,
 'fmcsa_cdlis', NULL, true, true, true, true),

-- Indiana Peer Recovery Specialist
('00000000-0000-0000-0000-000000000109',
 'Indiana Peer Recovery Specialist', 'IN-PRS',
 'ICAADA-certified Peer Recovery Specialist. Supports individuals in substance use recovery.',
 'partner_delivered', 'Indiana Counseling Association on Alcohol and Drug Abuse', 'https://www.icaada.org',
 NULL, 'in_person',
 true, 'proctored_written', 70,
 'icaada_registry', NULL, true, false, true, true),

-- DOT Specimen Collector
('00000000-0000-0000-0000-000000000110',
 'DOT Specimen Collector Certification', 'DOT-COLLECTOR',
 'Federal certification to collect urine specimens for DOT-regulated drug testing under 49 CFR Part 40.',
 'elevate_proctored', 'U.S. Department of Transportation', 'https://www.transportation.gov/odapc',
 'Elevate for Humanity', 'in_person',
 true, 'practical_and_written', 70,
 'dot_odapc', NULL, true, false, true, true),

-- NCCT Medical Assistant
('00000000-0000-0000-0000-000000000111',
 'NCCT Medical Assistant (NCMA)', 'NCMA',
 'National Center for Competency Testing Medical Assistant certification.',
 'partner_delivered', 'National Center for Competency Testing', 'https://www.ncctinc.com',
 NULL, 'computer_based',
 true, 'proctored_written', 70,
 'ncct_registry', NULL, true, false, true, true),

-- NCCT Phlebotomy
('00000000-0000-0000-0000-000000000112',
 'NCCT Phlebotomy Technician (NPT)', 'NPT',
 'National Center for Competency Testing Phlebotomy Technician certification.',
 'partner_delivered', 'National Center for Competency Testing', 'https://www.ncctinc.com',
 NULL, 'computer_based',
 true, 'proctored_written', 70,
 'ncct_registry', NULL, true, false, true, true),

-- CompTIA Security+
('00000000-0000-0000-0000-000000000113',
 'CompTIA Security+ SY0-701', 'SEC+',
 'CompTIA Security+ certification validating baseline cybersecurity skills. DoD 8570 approved.',
 'partner_delivered', 'CompTIA', 'https://www.comptia.org/certifications/security',
 'Pearson VUE', 'computer_based',
 true, 'proctored_written', 75,
 'comptia_registry', 36, true, false, true, true),

-- IRS AFSP
('00000000-0000-0000-0000-000000000114',
 'IRS Annual Filing Season Program', 'AFSP',
 'IRS voluntary program for non-credentialed tax preparers. Requires 18 CE hours annually.',
 'partner_delivered', 'Internal Revenue Service', 'https://www.irs.gov/tax-professionals/annual-filing-season-program',
 NULL, 'online',
 false, 'ce_completion', 70,
 'irs_rtrp_directory', 12, true, false, true, true)

ON CONFLICT (id) DO UPDATE SET
  name                  = EXCLUDED.name,
  abbreviation          = EXCLUDED.abbreviation,
  description           = EXCLUDED.description,
  issuer_type           = EXCLUDED.issuer_type,
  issuing_authority     = EXCLUDED.issuing_authority,
  issuing_authority_url = EXCLUDED.issuing_authority_url,
  proctor_authority     = EXCLUDED.proctor_authority,
  delivery              = EXCLUDED.delivery,
  requires_exam         = EXCLUDED.requires_exam,
  exam_type             = EXCLUDED.exam_type,
  passing_score         = EXCLUDED.passing_score,
  verification_source   = EXCLUDED.verification_source,
  renewal_period_months = EXCLUDED.renewal_period_months,
  wioa_eligible         = EXCLUDED.wioa_eligible,
  dol_registered        = EXCLUDED.dol_registered,
  is_active             = EXCLUDED.is_active,
  is_published          = EXCLUDED.is_published,
  updated_at            = now();
