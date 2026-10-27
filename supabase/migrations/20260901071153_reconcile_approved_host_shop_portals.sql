-- Reconcile every production-approved Host Shop into the canonical
-- partners -> partner_users -> shops -> host_shop_partnerships model.
-- Compliance completion is derived from accepted source documents; this
-- migration never fabricates uploads, signatures, or approvals.

create temporary table _approved_host_partners on commit drop as
select p.id
from public.partners p
where p.approval_status = 'approved'
  and p.status = 'active'
  and p.is_active is not false
  and concat_ws(' ', p.partner_type, p.program_type, p.programs::text)
      ~* '(barber|cosmet|nail|esthetic|salon|shop|training_site)'
  and concat_ws(' ', p.name, p.contact_email)
      !~* '(\[qa|qa e2e|test@|@test\.|@example\.|\.invalid|ffff|gggg|qwfh|gert|fvsdf)';

-- Persist one consistent requirement catalogue for current and future shops.
with requirements(program_id, document_type, document_name, description, requires_expiration) as (
  values
    ('barber', 'ein_letter', 'EIN / W-9 Business Identity Record', 'IRS EIN verification or an acceptable W-9 business identity record.', false),
    ('barber', 'barbershop_license', 'Indiana Barbershop License', 'Current Indiana barbershop establishment license.', true),
    ('barber', 'workers_comp', 'Workers Compensation Certificate', 'Workers compensation certificate or valid Indiana exemption.', false),
    ('barber', 'liability_insurance', 'General Liability Insurance Certificate', 'Current general liability insurance certificate.', true),
    ('barber', 'supervisor_license', 'Supervising Barber License', 'Current Indiana license for the direct apprentice supervisor.', true),
    ('cosmetology', 'ein_letter', 'EIN / W-9 Business Identity Record', 'IRS EIN verification or an acceptable W-9 business identity record.', false),
    ('cosmetology', 'salon_license', 'Indiana Cosmetology Salon License', 'Current Indiana cosmetology salon license.', true),
    ('cosmetology', 'workers_comp', 'Workers Compensation Certificate', 'Workers compensation certificate or valid Indiana exemption.', false),
    ('cosmetology', 'liability_insurance', 'General Liability Insurance Certificate', 'Current general liability insurance certificate.', true),
    ('cosmetology', 'supervisor_license', 'Supervising Cosmetologist License', 'Current Indiana license for the apprentice supervisor.', true),
    ('nail_technician', 'ein_letter', 'EIN / W-9 Business Identity Record', 'IRS EIN verification or an acceptable W-9 business identity record.', false),
    ('nail_technician', 'salon_license', 'Indiana Nail Salon License', 'Current Indiana nail salon license.', true),
    ('nail_technician', 'workers_comp', 'Workers Compensation Certificate', 'Workers compensation certificate or valid Indiana exemption.', false),
    ('nail_technician', 'liability_insurance', 'General Liability Insurance Certificate', 'Current general liability insurance certificate.', true),
    ('nail_technician', 'supervisor_license', 'Supervising Nail Technician License', 'Current Indiana license for the apprentice supervisor.', true),
    ('esthetician', 'ein_letter', 'EIN / W-9 Business Identity Record', 'IRS EIN verification or an acceptable W-9 business identity record.', false),
    ('esthetician', 'salon_license', 'Indiana Esthetician Establishment License', 'Current Indiana esthetics establishment license.', true),
    ('esthetician', 'workers_comp', 'Workers Compensation Certificate', 'Workers compensation certificate or valid Indiana exemption.', false),
    ('esthetician', 'liability_insurance', 'General Liability Insurance Certificate', 'Current general liability insurance certificate.', true),
    ('esthetician', 'supervisor_license', 'Supervising Esthetician License', 'Current Indiana license for the apprentice supervisor.', true)
)
insert into public.partner_document_requirements (
  state, program_id, document_type, document_name, description,
  is_required, allowed_file_types, max_file_size_mb, requires_expiration
)
select
  'Indiana', r.program_id, r.document_type, r.document_name, r.description,
  true, array['application/pdf','image/jpeg','image/png'], 10, r.requires_expiration
from requirements r
where not exists (
  select 1 from public.partner_document_requirements existing
  where existing.state = 'Indiana'
    and existing.program_id = r.program_id
    and existing.document_type = r.document_type
);

with approved_host_partners as (
  select p.* from public.partners p join _approved_host_partners t on t.id = p.id
), elevate_tenant as (
  select id from public.tenants where name = 'Elevate for Humanity' order by created_at limit 1
)
insert into public.shops (
  name, ein, address1, address2, city, state, zip, phone, email,
  active, tenant_id, owner_id, partner_id
)
select
  coalesce(nullif(p.shop_name, ''), nullif(p.dba, ''), p.name), p.ein,
  coalesce(p.address_line1, p.address), p.address_line2, p.city,
  case when upper(coalesce(p.state, 'IN')) = 'INDIANA' then 'IN' else coalesce(p.state, 'IN') end,
  p.zip, coalesce(p.contact_phone, p.phone), p.contact_email, true, t.id,
  (select pu.user_id from public.partner_users pu left join auth.users au on au.id = pu.user_id
   where pu.partner_id = p.id and pu.status = 'active'
   order by (lower(au.email) = lower(p.contact_email)) desc, pu.created_at limit 1),
  p.id
from approved_host_partners p cross join elevate_tenant t
where not exists (select 1 from public.shops s where s.partner_id = p.id);

with approved_host_partners as (
  select p.* from public.partners p join _approved_host_partners t on t.id = p.id
)
update public.shops s
set owner_id = coalesce(s.owner_id,
      (select pu.user_id from public.partner_users pu left join auth.users au on au.id = pu.user_id
       where pu.partner_id = p.id and pu.status = 'active'
       order by (lower(au.email) = lower(p.contact_email)) desc, pu.created_at limit 1)),
    active = true, updated_at = now()
from approved_host_partners p
where s.partner_id = p.id;

with canonical as (
  select p.*, s.id as canonical_shop_id, s.owner_id as canonical_owner_id
  from public.partners p join _approved_host_partners t on t.id = p.id
  join public.shops s on s.partner_id = p.id and s.active = true
)
update public.host_shop_partnerships hp
set shop_id = c.canonical_shop_id,
    owner_id = coalesce(hp.owner_id, c.canonical_owner_id),
    business_name = coalesce(nullif(hp.business_name, ''), c.name),
    contact_name = coalesce(nullif(hp.contact_name, ''), c.contact_name, c.owner_name),
    contact_email = coalesce(nullif(hp.contact_email, ''), c.contact_email),
    contact_phone = coalesce(nullif(hp.contact_phone, ''), c.contact_phone, c.phone),
    status = 'active', portal_access_enabled = true,
    portal_access_at = coalesce(hp.portal_access_at, now()), updated_at = now()
from canonical c where hp.partner_id = c.id;

with canonical as (
  select p.*, s.id as canonical_shop_id, s.owner_id as canonical_owner_id
  from public.partners p join _approved_host_partners t on t.id = p.id
  join public.shops s on s.partner_id = p.id and s.active = true
)
insert into public.host_shop_partnerships (
  business_name, business_type, address, website, contact_name, contact_email,
  contact_phone, status, partner_tier, portal_access_enabled, portal_access_at,
  onboarding_completed, license_verified, business_verified, partner_id, shop_id, owner_id
)
select c.name,
  case when concat_ws(' ', c.partner_type, c.program_type) ~* '(salon|cosmet)' then 'salon'
       when concat_ws(' ', c.partner_type, c.program_type) ~* 'nail' then 'nail_studio'
       when concat_ws(' ', c.partner_type, c.program_type) ~* '(esthetic|spa)' then 'esthetics_studio'
       else 'barbershop' end,
  coalesce(c.address, concat_ws(', ', c.address_line1, c.city, c.state, c.zip)),
  coalesce(c.website_url, c.website), coalesce(c.contact_name, c.owner_name),
  c.contact_email, coalesce(c.contact_phone, c.phone), 'active', 'free', true, now(), false,
  c.verification_status = 'verified', c.verification_status = 'verified',
  c.id, c.canonical_shop_id, c.canonical_owner_id
from canonical c
where not exists (select 1 from public.host_shop_partnerships hp where hp.partner_id = c.id);

with actual_docs as (
  select t.id,
    count(distinct pd.document_type) filter (
      where lower(coalesce(pd.status, '')) in ('accepted','approved','verified','complete','completed')
    ) as accepted_count
  from _approved_host_partners t
  left join public.partner_documents pd on pd.partner_id = t.id
  group by t.id
)
update public.partners p
set account_status = 'active',
    documents_verified = (d.accepted_count >= 5),
    onboarding_completed = case when d.accepted_count >= 5 then p.onboarding_completed else false end,
    onboarding_step = case when d.accepted_count >= 5 then p.onboarding_step else 'documents' end,
    updated_at = now()
from actual_docs d where p.id = d.id;

update public.host_shop_partnerships hp
set onboarding_completed = p.onboarding_completed, updated_at = now()
from public.partners p join _approved_host_partners t on t.id = p.id
where hp.partner_id = p.id;
