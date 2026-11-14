-- Reconcile source provenance and the demonstrably stale business total.
-- Does not change learner progress, approvals, RTI allocations, or signed standards.
BEGIN;
UPDATE public.apprenticeship_standard_versions
SET source_authority = 'U.S. DOL signed approval 2025-07-10; DOL Gmail message 19857620e2ca201c (2025-07-29); PDF SHA256 66fb85fb01aa92fae959e32840f48319ac1b4f59853962b66b887b3968497c34; source index docs/apprenticeship/REGISTERED_APPENDIX_SOURCE_INDEX.md',
    updated_at = now()
WHERE registration_number='2025-IN-132301' AND revision_date='2025-07-10'
  AND ((rapids_code='0030CB' AND competency_count=14 AND related_instruction_hours=260)
    OR (rapids_code='2089CB' AND competency_count=20 AND related_instruction_hours=300)
    OR (rapids_code='2090CB' AND competency_count=19 AND related_instruction_hours=210));

UPDATE public.programs
SET total_hours=32, updated_at=now()
WHERE slug='business-startup' AND training_hours=32 AND estimated_hours=32 AND total_hours=640;
COMMIT;
