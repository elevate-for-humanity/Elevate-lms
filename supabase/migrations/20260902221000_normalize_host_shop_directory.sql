-- Make the public Host Shop directory a projection of the canonical portal model.
-- Keep unrelated partner/business records intact; directory membership is controlled
-- by an active, opted-in Host Shop partnership tied to an active canonical shop.

update public.host_shops
set shop_status = 'inactive',
    is_accepting_apprentices = false,
    is_approved = false,
    updated_at = now()
where name in (
  'Classic Cuts & Co',
  'Fade Masters Barbershop',
  'Urban Edge Barbershop'
);

-- Default every partnership out of the directory, then opt in only canonical,
-- production-approved Host Shops. This clears stale flags such as Curvature's
-- without deleting its website or business record.
update public.host_shop_partnerships
set directory_listing = false,
    updated_at = now()
where directory_listing is distinct from false;

update public.host_shop_partnerships hp
set directory_listing = true,
    directory_listing_at = coalesce(hp.directory_listing_at, now()),
    updated_at = now()
from public.partners p
join public.shops s
  on s.partner_id = p.id
 and s.active = true
where hp.partner_id = p.id
  and hp.shop_id = s.id
  and hp.status = 'active'
  and hp.portal_access_enabled = true
  and p.approval_status = 'approved'
  and p.status = 'active'
  and p.is_active is not false
  and concat_ws(' ', p.partner_type, p.type, p.program_type, p.programs::text)
      ~* '(host_shop|training_site|barber|cosmet|nail|esthetic|salon)'
  and concat_ws(' ', p.name, p.contact_email)
      !~* '(\[qa|qa e2e|test@|@test\.|@example\.|\.invalid|ffff|gggg|qwfh|gert|fvsdf)';

create or replace view public.public_host_shops
with (security_invoker = true)
as
select
  p.id,
  p.public_slug,
  coalesce(p.dba, p.shop_name::varchar, p.name) as display_name,
  p.description,
  p.logo_url,
  p.flyer_url,
  p.website_url,
  p.website,
  p.phone,
  p.address_line1,
  p.address_line2,
  p.city,
  p.state,
  p.zip,
  p.programs,
  p.featured,
  p.display_order,
  p.public_profile_published_at,
  p.media_gallery,
  p.video_url,
  p.source_url,
  p.google_maps_url,
  p.media_verified_at
from public.partners p
where p.approval_status = 'approved'
  and p.status = 'active'
  and p.is_active is not false
  and p.public_slug is not null
  and exists (
    select 1
    from public.host_shop_partnerships hp
    join public.shops s
      on s.id = hp.shop_id
     and s.partner_id = p.id
     and s.active = true
    where hp.partner_id = p.id
      and hp.status = 'active'
      and hp.portal_access_enabled = true
      and hp.directory_listing = true
  );

comment on view public.public_host_shops is
  'Public directory of approved operational Host Shops with an active canonical shop and opted-in Host Shop partnership. Partner verification remains a separate compliance state.';

