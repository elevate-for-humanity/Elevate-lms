-- Canonical public promotional media belongs to the approved partner record.
-- public_host_shops remains a projection of verified, active, approved partners.

alter table public.partners
  add column if not exists media_gallery jsonb not null default '[]'::jsonb,
  add column if not exists video_url text,
  add column if not exists source_url text,
  add column if not exists google_maps_url text,
  add column if not exists media_verified_at timestamptz;

create or replace view public.public_host_shops as
select
  id,
  public_slug,
  coalesce(dba, shop_name::varchar, name) as display_name,
  description,
  logo_url,
  flyer_url,
  website_url,
  website,
  phone,
  address_line1,
  address_line2,
  city,
  state,
  zip,
  programs,
  featured,
  display_order,
  public_profile_published_at,
  media_gallery,
  video_url,
  source_url,
  google_maps_url,
  media_verified_at
from public.partners
where approval_status = 'approved'
  and status::text = 'active'
  and coalesce(is_active, true) = true
  and verification_status = 'verified'
  and public_slug is not null;
