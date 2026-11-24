-- These legacy defaults came from the generic clinical checklist. Preserve
-- existing files and reviews while removing the requirement for beauty trades.
UPDATE public.apprentice_document_types
SET is_required = false
WHERE program_slug IN (
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'nail-technician-apprenticeship'
)
  AND document_type IN ('background_check', 'drug_screen', 'cpr_card', 'immunizations', 'physical')
  AND is_required = true;

-- A résumé can be retained as an optional career resource for any learner.
UPDATE public.apprentice_document_types
SET is_required = false
WHERE document_type IN ('resume', 'résumé')
  AND is_required = true;
