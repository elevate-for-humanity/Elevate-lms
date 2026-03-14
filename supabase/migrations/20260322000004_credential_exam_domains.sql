-- =============================================================================
-- credential_exam_domains
--
-- Universal exam blueprint table. Replaces epa_exam_domains as the canonical
-- source for exam domain structure across all credentials.
--
-- epa_exam_domains is NOT dropped — it remains as the EPA-specific operational
-- table used by evaluate_exam_eligibility(). This table is the blueprint layer
-- that drives curriculum generation and coverage reporting.
--
-- Hierarchy:
--   credentials → credential_exam_domains → curriculum_lessons (via credential_domain_id)
--
-- Every generated lesson must reference a domain row here.
-- Every domain row must have weight_percent so coverage gaps are measurable.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.credential_exam_domains (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id    UUID NOT NULL REFERENCES public.credential_registry(id) ON DELETE CASCADE,
  domain_key       TEXT NOT NULL,          -- stable machine key, e.g. 'core', 'patient_care'
  domain_name      TEXT NOT NULL,          -- human label, e.g. 'EPA 608 Core'
  description      TEXT,
  weight_percent   INTEGER NOT NULL DEFAULT 0
    CHECK (weight_percent >= 0 AND weight_percent <= 100),
  question_count   INTEGER,               -- number of exam questions in this domain
  required_pass_count INTEGER,            -- for sim-based eligibility (mirrors epa_exam_domains)
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (credential_id, domain_key)      -- idempotency key for generator
);

CREATE INDEX IF NOT EXISTS idx_ced_credential
  ON public.credential_exam_domains(credential_id);

ALTER TABLE public.credential_exam_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ced_read_authenticated" ON public.credential_exam_domains
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ced_admin_all" ON public.credential_exam_domains
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.credential_exam_domains TO authenticated;
GRANT ALL    ON public.credential_exam_domains TO service_role;

-- =============================================================================
-- Add FK from curriculum_lessons.credential_domain_id → credential_exam_domains
-- (column was added in previous migration as plain UUID)
-- =============================================================================

ALTER TABLE public.curriculum_lessons
  DROP CONSTRAINT IF EXISTS fk_curriculum_lessons_domain;

ALTER TABLE public.curriculum_lessons
  ADD CONSTRAINT fk_curriculum_lessons_domain
  FOREIGN KEY (credential_domain_id)
  REFERENCES public.credential_exam_domains(id)
  ON DELETE SET NULL;

-- =============================================================================
-- Seed exam blueprint domains for all 14 credentials
-- Uses deterministic UUIDs so reruns are idempotent (ON CONFLICT DO NOTHING)
-- weight_percent sums to 100 per credential
-- =============================================================================

INSERT INTO public.credential_exam_domains
  (id, credential_id, domain_key, domain_name, description, weight_percent, question_count, required_pass_count, sort_order)
VALUES

-- ── EPA 608 Universal (mirrors epa_exam_domains) ─────────────────────────────
('ced00000-0000-0000-0000-000000000101', 'd37ae8a2-9297-44d1-83db-fa7ef375b796',
 'core', 'EPA 608 Core', 'Refrigerant handling, environmental impact, recovery requirements', 25, 25, 1, 1),
('ced00000-0000-0000-0000-000000000102', 'd37ae8a2-9297-44d1-83db-fa7ef375b796',
 'type_i', 'Type I — Small Appliances', 'Systems containing 5 lbs or less of refrigerant', 25, 25, 1, 2),
('ced00000-0000-0000-0000-000000000103', 'd37ae8a2-9297-44d1-83db-fa7ef375b796',
 'type_ii', 'Type II — High-Pressure', 'High-pressure systems, recovery techniques', 25, 25, 1, 3),
('ced00000-0000-0000-0000-000000000104', 'd37ae8a2-9297-44d1-83db-fa7ef375b796',
 'type_iii', 'Type III — Low-Pressure', 'Low-pressure systems, purging, leak detection', 25, 25, 1, 4),

-- ── OSHA 10-Hour Construction ─────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102',
 'intro_osha', 'Introduction to OSHA', 'OSHA mission, worker rights, employer responsibilities', 10, NULL, NULL, 1),
('ced00000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102',
 'fall_protection', 'Fall Protection', 'Fall hazards, guardrails, personal fall arrest systems', 25, NULL, NULL, 2),
('ced00000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000102',
 'electrical', 'Electrical Safety', 'Electrical hazards, lockout/tagout, GFCIs', 20, NULL, NULL, 3),
('ced00000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000102',
 'ppe', 'Personal Protective Equipment', 'PPE selection, use, and maintenance', 15, NULL, NULL, 4),
('ced00000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000102',
 'health_hazards', 'Health Hazards in Construction', 'Silica, lead, asbestos, noise, heat', 15, NULL, NULL, 5),
('ced00000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000102',
 'tools_equipment', 'Tools and Equipment Safety', 'Hand tools, power tools, scaffolding, ladders', 15, NULL, NULL, 6),

-- ── ACT WorkKeys NCRC ─────────────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000301', '3e4683f2-a977-4193-99d7-7b8d15270116',
 'applied_math', 'Applied Math', 'Workplace math problems, measurement, data interpretation', 34, 33, NULL, 1),
('ced00000-0000-0000-0000-000000000302', '3e4683f2-a977-4193-99d7-7b8d15270116',
 'workplace_documents', 'Workplace Documents', 'Reading and using workplace documents, forms, charts', 33, 35, NULL, 2),
('ced00000-0000-0000-0000-000000000303', '3e4683f2-a977-4193-99d7-7b8d15270116',
 'business_writing', 'Business Writing', 'Workplace writing, email, reports, instructions', 33, 30, NULL, 3),

-- ── Indiana Barber License ────────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000104',
 'theory_science', 'Theory and Science', 'Anatomy, physiology, chemistry, electricity', 20, 40, NULL, 1),
('ced00000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000104',
 'sanitation_safety', 'Sanitation and Safety', 'Infection control, sterilization, OSHA standards', 20, 40, NULL, 2),
('ced00000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000104',
 'cutting_styling', 'Cutting and Styling', 'Haircuts, clipper work, razor techniques, styling', 30, 60, NULL, 3),
('ced00000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000104',
 'shaving_treatments', 'Shaving and Facial Treatments', 'Straight razor shaving, facial massage, skin care', 15, 30, NULL, 4),
('ced00000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000104',
 'business_law', 'Business and Indiana Law', 'Salon management, Indiana PLA rules, ethics', 15, 30, NULL, 5),

-- ── Indiana Cosmetology License ───────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000105',
 'theory_science', 'Theory and Science', 'Anatomy, physiology, chemistry, electricity', 20, 40, NULL, 1),
('ced00000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000105',
 'sanitation_safety', 'Sanitation and Safety', 'Infection control, sterilization, OSHA standards', 20, 40, NULL, 2),
('ced00000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000105',
 'hair_services', 'Hair Services', 'Cutting, coloring, chemical services, styling', 30, 60, NULL, 3),
('ced00000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000105',
 'skin_nail_services', 'Skin and Nail Services', 'Facials, manicures, pedicures, waxing', 15, 30, NULL, 4),
('ced00000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000105',
 'business_law', 'Business and Indiana Law', 'Salon management, Indiana PLA rules, ethics', 15, 30, NULL, 5),

-- ── Indiana Nail Technician License ──────────────────────────────────────────
('ced00000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000106',
 'theory_science', 'Theory and Science', 'Anatomy, nail structure, chemistry', 25, 25, NULL, 1),
('ced00000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000106',
 'sanitation_safety', 'Sanitation and Safety', 'Infection control, sterilization, chemical safety', 25, 25, NULL, 2),
('ced00000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000106',
 'nail_services', 'Nail Services', 'Manicures, pedicures, nail enhancements, nail art', 35, 35, NULL, 3),
('ced00000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000106',
 'business_law', 'Business and Indiana Law', 'Indiana PLA rules, salon management, ethics', 15, 15, NULL, 4),

-- ── Indiana CNA ───────────────────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000107',
 'patient_care', 'Patient Care and Assistance', 'ADLs, positioning, transfers, range of motion', 30, 30, NULL, 1),
('ced00000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000107',
 'safety_emergency', 'Safety and Emergency Procedures', 'Fall prevention, fire safety, emergency response', 20, 20, NULL, 2),
('ced00000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000107',
 'infection_control', 'Infection Control', 'Hand hygiene, PPE, isolation precautions, OSHA', 20, 20, NULL, 3),
('ced00000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000107',
 'communication', 'Communication and Interpersonal Skills', 'Patient rights, communication, documentation', 15, 15, NULL, 4),
('ced00000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000107',
 'mental_health', 'Mental Health and Social Needs', 'Dementia care, emotional support, cultural sensitivity', 15, 15, NULL, 5),

-- ── CDL Class A ───────────────────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000108',
 'general_knowledge', 'General Knowledge', 'Vehicle systems, shifting, backing, coupling', 20, 50, NULL, 1),
('ced00000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000108',
 'air_brakes', 'Air Brakes', 'Air brake systems, inspection, emergency procedures', 20, 25, NULL, 2),
('ced00000-0000-0000-0000-000000000803', '00000000-0000-0000-0000-000000000108',
 'combination_vehicles', 'Combination Vehicles', 'Coupling/uncoupling, turning, backing combinations', 20, 20, NULL, 3),
('ced00000-0000-0000-0000-000000000804', '00000000-0000-0000-0000-000000000108',
 'hazmat', 'Hazardous Materials', 'HazMat regulations, placarding, emergency response', 20, 30, NULL, 4),
('ced00000-0000-0000-0000-000000000805', '00000000-0000-0000-0000-000000000108',
 'hours_of_service', 'Hours of Service and FMCSA Regulations', 'ELD, logbooks, FMCSA compliance', 20, 25, NULL, 5),

-- ── Peer Recovery Specialist ──────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000109',
 'recovery_support', 'Recovery Support Principles', 'Recovery models, peer support philosophy, lived experience', 25, 25, NULL, 1),
('ced00000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000109',
 'ethics_boundaries', 'Ethics and Professional Boundaries', 'ICAADA code of ethics, dual relationships, confidentiality', 20, 20, NULL, 2),
('ced00000-0000-0000-0000-000000000903', '00000000-0000-0000-0000-000000000109',
 'crisis_intervention', 'Crisis Intervention', 'Crisis recognition, de-escalation, safety planning', 20, 20, NULL, 3),
('ced00000-0000-0000-0000-000000000904', '00000000-0000-0000-0000-000000000109',
 'advocacy_navigation', 'Advocacy and System Navigation', 'Community resources, referrals, advocacy skills', 20, 20, NULL, 4),
('ced00000-0000-0000-0000-000000000905', '00000000-0000-0000-0000-000000000109',
 'documentation', 'Documentation and Reporting', 'Case notes, progress reports, HIPAA compliance', 15, 15, NULL, 5),

-- ── DOT Specimen Collector ────────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000110',
 'dot_regulations', 'DOT 49 CFR Part 40 Regulations', 'Federal drug testing regulations, employer obligations', 25, NULL, NULL, 1),
('ced00000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000110',
 'collection_procedures', 'Collection Procedures', 'Step-by-step urine collection, observed collections', 35, NULL, NULL, 2),
('ced00000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000110',
 'chain_of_custody', 'Chain of Custody', 'CCF completion, specimen handling, lab submission', 25, NULL, NULL, 3),
('ced00000-0000-0000-0000-000000000a04', '00000000-0000-0000-0000-000000000110',
 'error_correction', 'Error Correction and Shy Bladder', 'Correctable flaws, fatal flaws, shy bladder protocol', 15, NULL, NULL, 4),

-- ── NCCT Medical Assistant ────────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000111',
 'clinical_procedures', 'Clinical Procedures', 'Vital signs, injections, EKG, phlebotomy, wound care', 35, 70, NULL, 1),
('ced00000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000111',
 'administrative', 'Administrative Procedures', 'Scheduling, billing, coding, medical records, HIPAA', 25, 50, NULL, 2),
('ced00000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-000000000111',
 'pharmacology', 'Pharmacology', 'Drug classifications, dosage calculations, medication administration', 20, 40, NULL, 3),
('ced00000-0000-0000-0000-000000000b04', '00000000-0000-0000-0000-000000000111',
 'law_ethics', 'Medical Law and Ethics', 'HIPAA, patient rights, scope of practice, liability', 20, 40, NULL, 4),

-- ── NCCT Phlebotomy ───────────────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000c01', '00000000-0000-0000-0000-000000000112',
 'venipuncture', 'Venipuncture Techniques', 'Vacutainer, butterfly, syringe methods, site selection', 35, 35, NULL, 1),
('ced00000-0000-0000-0000-000000000c02', '00000000-0000-0000-0000-000000000112',
 'specimen_handling', 'Specimen Handling and Processing', 'Tube order, centrifugation, labeling, transport', 25, 25, NULL, 2),
('ced00000-0000-0000-0000-000000000c03', '00000000-0000-0000-0000-000000000112',
 'safety_infection', 'Safety and Infection Control', 'Standard precautions, sharps safety, PPE', 20, 20, NULL, 3),
('ced00000-0000-0000-0000-000000000c04', '00000000-0000-0000-0000-000000000112',
 'anatomy_physiology', 'Anatomy and Physiology', 'Circulatory system, vein anatomy, coagulation', 20, 20, NULL, 4),

-- ── CompTIA Security+ SY0-701 ─────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000113',
 'threats_attacks', 'Threats, Attacks and Vulnerabilities', 'Malware, social engineering, application attacks, network attacks', 24, 35, NULL, 1),
('ced00000-0000-0000-0000-000000000d02', '00000000-0000-0000-0000-000000000113',
 'architecture', 'Architecture and Design', 'Cloud, virtualization, secure network design, zero trust', 21, 30, NULL, 2),
('ced00000-0000-0000-0000-000000000d03', '00000000-0000-0000-0000-000000000113',
 'implementation', 'Implementation', 'Cryptography, PKI, wireless security, identity management', 25, 36, NULL, 3),
('ced00000-0000-0000-0000-000000000d04', '00000000-0000-0000-0000-000000000113',
 'operations_incident', 'Operations and Incident Response', 'Incident response, forensics, disaster recovery', 16, 23, NULL, 4),
('ced00000-0000-0000-0000-000000000d05', '00000000-0000-0000-0000-000000000113',
 'governance_risk', 'Governance, Risk and Compliance', 'Frameworks, policies, risk management, privacy', 14, 21, NULL, 5),

-- ── IRS AFSP ──────────────────────────────────────────────────────────────────
('ced00000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-000000000114',
 'federal_tax_law', 'Federal Tax Law Update', 'Current year tax law changes, credits, deductions', 33, NULL, NULL, 1),
('ced00000-0000-0000-0000-000000000e02', '00000000-0000-0000-0000-000000000114',
 'individual_returns', 'Individual Tax Returns', 'Form 1040, schedules, filing status, dependents', 34, NULL, NULL, 2),
('ced00000-0000-0000-0000-000000000e03', '00000000-0000-0000-0000-000000000114',
 'ethics', 'Ethics for Tax Professionals', 'Circular 230, preparer penalties, due diligence', 33, NULL, NULL, 3)

ON CONFLICT (credential_id, domain_key) DO UPDATE SET
  domain_name         = EXCLUDED.domain_name,
  description         = EXCLUDED.description,
  weight_percent      = EXCLUDED.weight_percent,
  question_count      = EXCLUDED.question_count,
  required_pass_count = EXCLUDED.required_pass_count,
  sort_order          = EXCLUDED.sort_order;
