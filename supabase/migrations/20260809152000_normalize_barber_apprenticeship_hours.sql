-- Normalize the Barber Apprenticeship program record to the registered-program
-- source of truth in lib/compliance/rapids-config.ts.
--
-- Semantics:
--   total_hours / estimated_hours / min_ojl_hours = required OJL hours
--   training_hours / required_hours / hours / min_rti_hours = required RTI hours
--   Public copy may state 2,144 total training hours (2,000 OJL + 144 RTI).

UPDATE public.programs
SET
  description = 'Earn your Indiana barber license through a DOL-registered apprenticeship. Complete 2,000 hours of supervised on-the-job learning (OJL) at an approved host shop plus 144 hours of Related Technical Instruction (RTI) through the registered program.',
  full_description = 'DOL Registered Apprenticeship in barbering requiring 2,000 hours of supervised on-the-job learning (OJL) plus 144 hours of Related Technical Instruction (RTI), for 2,144 total training hours. Apprentices complete documented competencies under qualified supervision and prepare for Indiana barber licensure requirements.',
  short_description = 'USDOL Registered Barber Apprenticeship: 2,000 OJL hours + 144 RTI hours (2,144 total training hours).',
  estimated_hours = 2000,
  total_hours = 2000,
  min_ojl_hours = 2000,
  training_hours = 144,
  required_hours = 144,
  hours = 144,
  min_rti_hours = 144,
  updated_at = now()
WHERE slug = 'barber-apprenticeship';
