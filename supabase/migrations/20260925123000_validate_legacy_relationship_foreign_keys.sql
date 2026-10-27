-- Reconcile legacy orphaned relationship IDs, then validate the FKs.
-- Descriptive legacy fields are preserved; only broken UUID references are repaired.

-- Apprentice: use the active canonical program enrollment for this user.
update public.apprentices
set program_id = '5ff21fcb-1968-41fd-99d3-37d69a31bd5c',
    updated_at = now()
where id = '6828f6d0-a33a-4a9a-998a-58ccf36ed884'
  and program_id = '6b6937b2-b90d-42c9-bf0e-d92d517176ba';

-- Host-shop enrollments: remap surviving shops by canonical name.
update public.program_enrollments
set host_shop_id = '9f7a6b6e-ca81-4a9a-941a-655d688622bf',
    updated_at = now()
where id = '0bec9809-143a-4be7-8b2b-e96121615c43'
  and host_shop_id = 'cb30517f-710c-4df3-b0f1-c8adc5c6b472';

update public.program_enrollments
set host_shop_id = '234504ea-6f7c-415c-b6f2-aa32ce8a0cbe',
    updated_at = now()
where id = '47e75da9-2903-4b9a-ba3b-fc23f00ec1a5'
  and host_shop_id = '7d222e31-f2f2-4c10-8022-e4705ffe4a25';

-- Disposable QA fixture's host-shop row no longer exists. Preserve the fixture
-- metadata/name but remove only the invalid relational pointer.
update public.program_enrollments
set host_shop_id = null,
    updated_at = now()
where id = '1fde434b-be16-4b3c-a327-93b9aff0ad20'
  and host_shop_id = 'b0146413-ae9b-4774-b881-b096f664b5c9'
  and coalesce(draft_data->>'qa_e2e','') = 'true';

-- Program-holder enrollments: remap to the active holder assigned to Barber.
update public.program_enrollments
set program_holder_id = 'f9d0329a-ad7b-4854-923f-3ef3aa8322b0',
    updated_at = now()
where id in (
  '6a421a19-a4f7-4259-8c48-6a9c47c36669',
  '3a0b0551-af14-42da-8491-977f33a2adf0'
)
and program_holder_id = '66833b02-ec3f-4a6e-a7e0-00268d3cf7ed';

-- These partner records were retired. Keep partner_name as historical/source
-- attribution, but remove the dead UUID relationship rather than inventing a
-- replacement partner entity.
update public.programs p
set partner_id = null,
    updated_at = now()
where p.partner_id is not null
  and not exists (select 1 from public.partners x where x.id = p.partner_id);

alter table public.apprentices
  validate constraint apprentices_program_id_fkey;
alter table public.program_enrollments
  validate constraint program_enrollments_host_shop_id_fkey;
alter table public.program_enrollments
  validate constraint program_enrollments_program_holder_id_fkey;
alter table public.programs
  validate constraint programs_partner_id_fkey;
