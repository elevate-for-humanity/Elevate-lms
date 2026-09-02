-- Isolate the intentional public projection behind a least-privilege function
-- in a non-exposed schema. The public view remains SECURITY INVOKER and callers
-- never receive direct access to partners, profiles, shops, or partnerships.

create schema if not exists directory_private;
revoke all on schema directory_private from public;
grant usage on schema directory_private to anon, authenticated;

create or replace function directory_private.list_public_host_shops()
returns table (
  id uuid,
  public_slug text,
  display_name varchar,
  description text,
  logo_url text,
  flyer_url text,
  website_url text,
  website varchar(255),
  phone varchar(20),
  address_line1 varchar(255),
  address_line2 varchar(255),
  city varchar(100),
  state varchar(50),
  zip varchar(20),
  programs jsonb,
  featured boolean,
  display_order integer,
  public_profile_published_at timestamptz,
  media_gallery jsonb,
  video_url text,
  source_url text,
  google_maps_url text,
  media_verified_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p.id,
    p.public_slug,
    coalesce(p.dba, p.shop_name::varchar, p.name)::varchar as display_name,
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
$$;

revoke all on function directory_private.list_public_host_shops() from public;
grant execute on function directory_private.list_public_host_shops()
  to anon, authenticated;

create or replace view public.public_host_shops
with (security_invoker = true)
as
select * from directory_private.list_public_host_shops();

grant select on public.public_host_shops to anon, authenticated;

comment on function directory_private.list_public_host_shops() is
  'Least-privilege public Host Shop projection. Returns approved marketing fields only.';
comment on view public.public_host_shops is
  'Public SECURITY INVOKER facade over the locked Host Shop directory projection.';
