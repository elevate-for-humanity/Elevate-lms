-- Check if program blueprint exists for steps generation
-- This tells us whether steps SHOULD generate

SELECT
  ppl.program_id,
  ppl.sequence_order,
  ppl.is_required,
  plp.provider_name
FROM public.program_partner_lms ppl
JOIN public.partner_lms_providers plp ON plp.id = ppl.provider_id
WHERE ppl.program_id = '69421a47-df6d-48c4-8797-77e7ee130d2f'
ORDER BY ppl.sequence_order;
