-- ---------------------------------------------------------------------------
-- epatest.com supplemental certifications for HVAC Technician program
--
-- All 6 certs are issued by Mainstream Engineering via epatest.com.
-- They are open-book, no time limit, self-paced — no proctoring required.
-- Students take them independently after completing EPA 608.
-- Cost: $26.95 per exam (wallet card included). Retest: $7.95.
--
-- Adds:
--   1. credential_providers row for epatest.com / Mainstream Engineering
--   2. credential_registry rows for each cert
--   3. program_external_courses rows linked to hvac-technician
-- ---------------------------------------------------------------------------

-- ── 1. Credential provider ────────────────────────────────────────────────

INSERT INTO public.credential_providers
  (id, name, provider_type, exam_scheduling_url, verification_api,
   verification_adapter, contact_email, notes)
VALUES
  ('c0000000-0000-0000-0000-000000000020',
   'Mainstream Engineering Corporation (EPATest.com)',
   'industry_body',
   'https://securesite.mainstream-engr.com/JSP/OpenBook/login.jsp',
   'https://securesite.mainstream-engr.com/cert-lookup/',
   'mainstream_epatest',
   NULL,
   'Open-book, self-paced supplemental certs: R-410A, PM Tech, IAQ, Green HVAC/R, EPA 609, HC/HFO. No proctoring required. $26.95 per exam. Wallet card included. Retest $7.95.')
ON CONFLICT (id) DO UPDATE SET
  name                 = EXCLUDED.name,
  exam_scheduling_url  = EXCLUDED.exam_scheduling_url,
  notes                = EXCLUDED.notes;

-- ── 2. Credential registry ────────────────────────────────────────────────

INSERT INTO public.credential_registry
  (id, name, abbreviation, issuer_type, issuing_authority, competency_area,
   proctor_authority, exam_type, passing_score, is_active, notes)
VALUES

  -- R-410A
  ('d1000000-0000-0000-0000-000000000001',
   'R-410A Certification',
   'R-410A',
   'partner_delivered',
   'Mainstream Engineering Corporation',
   'hvac',
   'none',
   'none',
   70,
   true,
   'Open-book, self-paced. Covers high-pressure R-410A handling. Requires EPA 608. $26.95 at epatest.com.'),

  -- PM Tech
  ('d1000000-0000-0000-0000-000000000002',
   'PM Tech Certification',
   'PM-TECH',
   'partner_delivered',
   'Mainstream Engineering Corporation',
   'hvac',
   'none',
   'none',
   70,
   true,
   'Open-book, self-paced. Preventative maintenance: acid/moisture detection, compressor maintenance, coil maintenance, leak testing. Requires EPA 608. $26.95 at epatest.com.'),

  -- Indoor Air Quality
  ('d1000000-0000-0000-0000-000000000003',
   'Indoor Air Quality Certification',
   'IAQ',
   'partner_delivered',
   'Mainstream Engineering Corporation',
   'hvac',
   'none',
   'none',
   70,
   true,
   'Open-book, self-paced. IAQ principles and QwikProducts usage. $26.95 at epatest.com.'),

  -- Green HVAC/R
  ('d1000000-0000-0000-0000-000000000004',
   'Green HVAC/R Certification',
   'GREEN-HVAC',
   'partner_delivered',
   'Mainstream Engineering Corporation',
   'hvac',
   'none',
   'none',
   70,
   true,
   'Open-book, self-paced. Energy audits, energy-efficient equipment, preventative maintenance for optimum HVAC operation. $26.95 at epatest.com.'),

  -- EPA 609 MVAC
  ('d1000000-0000-0000-0000-000000000005',
   'EPA Section 609 MVAC Certification',
   'EPA-609',
   'partner_delivered',
   'Mainstream Engineering Corporation / U.S. EPA',
   'hvac',
   'none',
   'none',
   70,
   true,
   'Open-book, self-paced. Required by EPA for technicians servicing refrigerants in motor vehicles (MVAC). Mainstream is EPA-approved for 609 certification. $26.95 at epatest.com.'),

  -- HC/HFO (A3/A2L)
  ('d1000000-0000-0000-0000-000000000006',
   'HC (A3) & HFO (A2L) Low-GWP Refrigerant Certification',
   'HC-HFO',
   'partner_delivered',
   'Mainstream Engineering Corporation',
   'hvac',
   'none',
   'none',
   70,
   true,
   'Open-book, self-paced. Safe handling of flammable (A3) and slightly flammable (A2L) low-GWP refrigerants. Covers next-generation refrigerants replacing R-410A. Requires EPA 608. $26.95 at epatest.com.')

ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  abbreviation      = EXCLUDED.abbreviation,
  issuing_authority = EXCLUDED.issuing_authority,
  notes             = EXCLUDED.notes,
  is_active         = EXCLUDED.is_active;

-- ── 3. program_external_courses — link to hvac-technician ─────────────────
-- Uses slug lookup so this is safe to run before or after program seed.

DO $$
DECLARE
  prog_id uuid;
BEGIN
  SELECT id INTO prog_id FROM public.programs WHERE slug = 'hvac-technician' LIMIT 1;
  IF prog_id IS NULL THEN
    RAISE NOTICE 'hvac-technician program not found — skipping external course inserts';
    RETURN;
  END IF;

  INSERT INTO public.program_external_courses
    (program_id, partner_name, title, external_url, description,
     duration_display, credential_name, enrollment_instructions,
     is_required, manual_completion_enabled, sort_order,
     cost_cents, payer_rule, is_active)
  VALUES

    -- R-410A
    (prog_id,
     'Mainstream Engineering (EPATest.com)',
     'R-410A Certification',
     'https://ww2.epatest.com/r410a/',
     'Supplemental certification covering safe handling of R-410A high-pressure refrigerant. Open-book, no time limit. Wallet card included.',
     '1–2 hours',
     'R-410A Certification',
     E'1. Go to https://ww2.epatest.com/r410a/\n2. Read the free certification manual (linked on the page)\n3. Click "Get Started" to purchase and begin the open-book exam ($26.95)\n4. Complete the exam at your own pace — no time limit\n5. Download your wallet card and upload it here',
     false,
     true,
     10,
     2695,
     'always_student',
     true),

    -- PM Tech
    (prog_id,
     'Mainstream Engineering (EPATest.com)',
     'PM Tech Certification',
     'https://ww2.epatest.com/pmtech/',
     'Preventative maintenance certification covering acid/moisture detection, compressor maintenance, coil maintenance, refrigeration charging, and leak testing. Requires EPA 608.',
     '1–2 hours',
     'PM Tech Certification',
     E'1. Go to https://ww2.epatest.com/pmtech/\n2. Read the free PM Tech Certification Manual\n3. Click "Get Started" to purchase and begin the open-book exam ($26.95)\n4. Complete the exam at your own pace — no time limit\n5. Download your wallet card and upload it here',
     false,
     true,
     20,
     2695,
     'always_student',
     true),

    -- Indoor Air Quality
    (prog_id,
     'Mainstream Engineering (EPATest.com)',
     'Indoor Air Quality (IAQ) Certification',
     'https://ww2.epatest.com/iaq/',
     'IAQ certification covering indoor air quality principles and best practices. Open-book, no time limit.',
     '1–2 hours',
     'IAQ Certification',
     E'1. Go to https://ww2.epatest.com/iaq/\n2. Review the study materials on the page\n3. Click "Get Started" to purchase and begin the open-book exam ($26.95)\n4. Complete the exam at your own pace — no time limit\n5. Download your wallet card and upload it here',
     false,
     true,
     30,
     2695,
     'always_student',
     true),

    -- Green HVAC/R
    (prog_id,
     'Mainstream Engineering (EPATest.com)',
     'Green HVAC/R Certification',
     'https://ww2.epatest.com/green/',
     'Demonstrates knowledge of energy audits, energy-efficient equipment, and preventative maintenance for optimum HVAC operation. Increasingly valued by employers and building owners.',
     '1–2 hours',
     'Green HVAC/R Certification',
     E'1. Go to https://ww2.epatest.com/green/\n2. Read the free Green HVAC/R Certification Manual\n3. Click "Get Started" to purchase and begin the open-book exam ($26.95)\n4. Complete the exam at your own pace — no time limit\n5. Download your wallet card and upload it here',
     false,
     true,
     40,
     2695,
     'always_student',
     true),

    -- EPA 609 MVAC
    (prog_id,
     'Mainstream Engineering (EPATest.com)',
     'EPA Section 609 MVAC Certification',
     'https://ww2.epatest.com/epa-609-mvac/',
     'Required by EPA for any technician servicing refrigerants in motor vehicle air conditioning systems (MVAC). Mainstream Engineering is EPA-approved for 609 certification.',
     '1–2 hours',
     'EPA 609 MVAC Certification',
     E'1. Go to https://ww2.epatest.com/epa-609-mvac/\n2. Review the study guide and practice tests\n3. Click "Get Started" to purchase and begin the open-book exam ($26.95)\n4. Complete the exam at your own pace — no time limit\n5. Download your wallet card and upload it here',
     false,
     true,
     50,
     2695,
     'always_student',
     true),

    -- HC/HFO
    (prog_id,
     'Mainstream Engineering (EPATest.com)',
     'HC (A3) & HFO (A2L) Low-GWP Refrigerant Certification',
     'https://ww2.epatest.com/hc-hfo-low-gwp/',
     'Covers safe handling of next-generation flammable (A3) and slightly flammable (A2L) low-GWP refrigerants replacing R-410A. Critical as the industry transitions away from high-GWP refrigerants. Requires EPA 608.',
     '1–2 hours',
     'HC/HFO Low-GWP Certification',
     E'1. Go to https://ww2.epatest.com/hc-hfo-low-gwp/\n2. Read the free HC/HFO Low-GWP-A2L Manual\n3. Click "Get Started" to purchase and begin the open-book exam ($26.95)\n4. Complete the exam at your own pace — no time limit\n5. Download your wallet card and upload it here',
     false,
     true,
     60,
     2695,
     'always_student',
     true)

  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Inserted epatest.com supplemental certs for program %', prog_id;
END $$;
