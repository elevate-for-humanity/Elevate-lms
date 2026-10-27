-- Apprentice agreements are platform-generated and signed electronically.
-- Employer offer letters are employer-side records, not learner upload requirements.
update public.apprentice_document_types
set is_required = false,
    description = 'Read and sign the generated apprenticeship agreement electronically in the apprentice portal. Do not upload a copy.'
where lower(document_type) = 'apprenticeship_agreement';

update public.apprentice_document_types
set is_required = false,
    description = 'Completed by the assigned employer or Host Site in its employer dashboard. The apprentice does not upload this record.'
where lower(document_type) = 'employer_verification'
  and display_name in (
    'Employer Verification / Offer Letter',
    'Host Salon Employment Verification'
  );

comment on table public.apprentice_document_types is
  'Upload-only apprentice evidence types. Student agreements and acknowledgments are generated and signed in the portal. Employer-side agreements remain in the employer workspace and are not apprentice upload requirements.';
