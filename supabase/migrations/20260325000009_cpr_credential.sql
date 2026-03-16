-- =============================================================================
-- CareerSafe CPR/First Aid/AED credential
--
-- CareerSafe is an OSHA-authorized online provider. Students complete the
-- course and exam on the CareerSafe platform (hybrid delivery — external
-- platform, online exam). Elevate pays the fee, staff forwards the enrollment
-- link to the student, student uploads their CareerSafe certificate on
-- completion.
--
-- Appears on INTraining for: HVAC, Beauty Educator, Emergency Health & Safety,
-- Home Health Aide, Medical Assistant, Public Safety Reentry Specialist.
-- =============================================================================

BEGIN;

-- ── 1. credential_registry ────────────────────────────────────────────────────

INSERT INTO public.credential_registry (
  id, name, abbreviation, description,
  issuer_type, issuing_authority,
  proctor_authority, delivery,
  requires_exam, exam_type, passing_score,
  verification_source, renewal_period_months,
  wioa_eligible, dol_registered, is_active, is_published
) VALUES
('00000000-0000-0000-0000-000000000116',
 'CareerSafe CPR/First Aid/AED', 'CPR-FA',
 'CareerSafe online CPR, First Aid, AED, and Bloodborne Pathogens certification. OSHA-authorized provider. Valid 2 years.',
 'partner_delivered', 'CareerSafe',
 'none', 'hybrid',
 true, 'online', 80,
 'issuer_api', 24, true, false, true, true)
ON CONFLICT (id) DO UPDATE SET
  name                  = EXCLUDED.name,
  abbreviation          = EXCLUDED.abbreviation,
  description           = EXCLUDED.description,
  issuer_type           = EXCLUDED.issuer_type,
  issuing_authority     = EXCLUDED.issuing_authority,
  delivery              = EXCLUDED.delivery,
  requires_exam         = EXCLUDED.requires_exam,
  exam_type             = EXCLUDED.exam_type,
  passing_score         = EXCLUDED.passing_score,
  verification_source   = EXCLUDED.verification_source,
  renewal_period_months = EXCLUDED.renewal_period_months,
  wioa_eligible         = EXCLUDED.wioa_eligible,
  is_active             = EXCLUDED.is_active,
  is_published          = EXCLUDED.is_published,
  updated_at            = now();

-- ── 2. credential_exam_domains ────────────────────────────────────────────────

INSERT INTO public.credential_exam_domains (
  id, credential_id, domain_key, domain_name, description,
  weight_percent, question_count, required_pass_count, sort_order
) VALUES
('ced00000-0000-0000-0000-000000000211',
 '00000000-0000-0000-0000-000000000116',
 'cpr_aed', 'CPR and AED',
 'Adult/child/infant CPR, AED operation, chain of survival, hands-only CPR',
 40, 20, 16, 1),
('ced00000-0000-0000-0000-000000000212',
 '00000000-0000-0000-0000-000000000116',
 'first_aid', 'First Aid',
 'Wound care, burns, fractures, choking, shock, stroke, diabetic emergencies',
 40, 20, 16, 2),
('ced00000-0000-0000-0000-000000000213',
 '00000000-0000-0000-0000-000000000116',
 'bloodborne_pathogens', 'Bloodborne Pathogens',
 'OSHA BBP standard, exposure control, PPE, post-exposure procedures, HBV/HCV/HIV',
 20, 10, 8, 3)
ON CONFLICT (id) DO NOTHING;

-- ── 3. credential_providers: add CareerSafe ───────────────────────────────────

INSERT INTO public.credential_providers (
  id, name, provider_type,
  exam_scheduling_url, verification_api, verification_adapter,
  contact_email, notes
) VALUES (
  'c0000000-0000-0000-0000-000000000012',
  'CareerSafe', 'industry_body',
  'https://www.careersafeonline.com',
  NULL,
  'careersafe',
  'support@careersafeonline.com',
  'OSHA-authorized online CPR/First Aid/AED provider. Students complete course and exam on CareerSafe platform. Elevate purchases enrollment codes.'
)
ON CONFLICT (name) DO UPDATE SET
  exam_scheduling_url  = EXCLUDED.exam_scheduling_url,
  verification_adapter = EXCLUDED.verification_adapter,
  contact_email        = EXCLUDED.contact_email,
  notes                = EXCLUDED.notes,
  updated_at           = now();

-- Backfill provider_id on credential_registry
UPDATE public.credential_registry
SET provider_id = 'c0000000-0000-0000-0000-000000000012'
WHERE id = '00000000-0000-0000-0000-000000000116';

-- ── 4. program_credentials: link CPR to all INTraining programs ───────────────
-- Programs from INTraining listing that include CPR:
--   hvac-technician, beauty-educator, emergency-health-safety,
--   home-health-aide, medical-assistant, peer-recovery-specialist-jri

WITH prog AS (
  SELECT id, slug FROM public.programs
  WHERE slug IN (
    'hvac-technician',
    'beauty-educator',
    'emergency-health-safety',
    'home-health-aide',
    'medical-assistant',
    'peer-recovery-specialist-jri'
  )
)
INSERT INTO public.program_credentials (
  program_id, credential_id, is_primary, display_order,
  exam_fee_payer, exam_fee_cents, notes
)
SELECT
  p.id,
  '00000000-0000-0000-0000-000000000116',
  false,
  CASE p.slug
    WHEN 'hvac-technician'              THEN 5
    WHEN 'peer-recovery-specialist-jri' THEN 4
    ELSE 3
  END,
  'elevate',
  -- CareerSafe CPR enrollment fee (per student)
  2500,
  'CareerSafe CPR/First Aid/AED online course. Elevate purchases enrollment code. Student completes on CareerSafe platform.'
FROM prog p
ON CONFLICT (program_id, credential_id) DO UPDATE SET
  exam_fee_payer = EXCLUDED.exam_fee_payer,
  exam_fee_cents = EXCLUDED.exam_fee_cents,
  notes          = EXCLUDED.notes;

COMMIT;
