-- Correct production Host Shop identity records without deleting commerce data.
-- Salon Salon LLC is an invalid duplicate of Salon Saloon LLC.
-- Curvature Body Sculpting operates the Meri-Gold-Round store and is not a Host Shop.

update public.host_shop_partnerships
set status = 'cancelled', portal_access_enabled = false, updated_at = now()
where partner_id in (select id from public.partners where name = 'Salon Salon LLC');

update public.shops
set active = false, updated_at = now()
where partner_id in (select id from public.partners where name = 'Salon Salon LLC');

update public.partner_users
set status = 'inactive'
where partner_id in (select id from public.partners where name = 'Salon Salon LLC');

update public.partners
set status = 'inactive', is_active = false, account_status = 'suspended',
    onboarding_completed = false, documents_verified = false, updated_at = now()
where name = 'Salon Salon LLC';

update public.host_shop_partnerships
set status = 'cancelled', portal_access_enabled = false, updated_at = now()
where partner_id in (select id from public.partners where name = 'Curvature Body Sculpting');

update public.shops
set active = false, updated_at = now()
where partner_id in (select id from public.partners where name = 'Curvature Body Sculpting');

update public.partner_users
set status = 'inactive'
where partner_id in (select id from public.partners where name = 'Curvature Body Sculpting');

update public.partners
set partner_type = null, type = null, program_type = null, programs = '[]'::jsonb,
    onboarding_completed = false, documents_verified = false, updated_at = now()
where name = 'Curvature Body Sculpting';

-- Reuse Jozanna George's established Program Holder account for Mesmerized by Beauty.
insert into public.partner_users (user_id, partner_id, role, status)
select pr.id, p.id, 'partner_admin', 'active'
from public.partners p
join public.profiles pr on lower(pr.email) = lower(p.contact_email)
where p.name = 'Mesmerized by Beauty Cosmetology Academy'
  and pr.email is not null
on conflict (user_id, partner_id)
do update set role = excluded.role, status = excluded.status;

update public.shops s
set owner_id = pr.id, updated_at = now()
from public.partners p
join public.profiles pr on lower(pr.email) = lower(p.contact_email)
where s.partner_id = p.id
  and p.name = 'Mesmerized by Beauty Cosmetology Academy'
  and pr.email is not null;

update public.host_shop_partnerships h
set owner_id = pr.id, updated_at = now()
from public.partners p
join public.profiles pr on lower(pr.email) = lower(p.contact_email)
where h.partner_id = p.id
  and p.name = 'Mesmerized by Beauty Cosmetology Academy'
  and pr.email is not null;
