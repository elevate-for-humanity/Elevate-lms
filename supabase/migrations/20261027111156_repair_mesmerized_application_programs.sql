set lock_timeout = '5s';
alter table public.school_applications drop constraint if exists school_applications_program_interest_check;
alter table public.school_applications add constraint school_applications_program_interest_check
  check (program_interest in ('barber-apprenticeship','cosmetology-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship'));

-- Preserve all current approvals and MOU state. Bind only the already-approved
-- school to its existing holder; runtime queries never infer ownership by email.
with bindings as (
  select ph.id, jsonb_agg(distinct p.id::text) as partner_ids
  from public.program_holders ph join public.partners p
    on lower(p.contact_email) = lower(ph.contact_email)
  where lower(ph.contact_email) = 'mesmerizedbybeautyl@yahoo.com'
    and ph.status in ('active','approved') and ph.approved_at is not null and ph.mou_signed = true
  group by ph.id
)
update public.program_holders ph
set features = jsonb_set(coalesce(ph.features, '{}'::jsonb), '{school_partner_ids}',
  (select jsonb_agg(distinct value) from jsonb_array_elements(
    (case when jsonb_typeof(ph.features->'school_partner_ids') = 'array'
      then ph.features->'school_partner_ids' else '[]'::jsonb end) || bindings.partner_ids) as ids(value)))
from bindings where ph.id = bindings.id;
