-- SECURITY INVOKER views require callers to have read permission on every
-- referenced column. Grant only the public projection/filter columns; do not
-- grant table-wide access or any private partner, owner, or compliance fields.

grant select (
  id, public_slug, dba, shop_name, name, description, logo_url, flyer_url,
  website_url, website, phone, address_line1, address_line2, city, state, zip,
  programs, featured, display_order, public_profile_published_at, media_gallery,
  video_url, source_url, google_maps_url, media_verified_at,
  approval_status, status, is_active
) on public.partners to anon, authenticated;

grant select (
  partner_id, shop_id, status, portal_access_enabled, directory_listing
) on public.host_shop_partnerships to anon, authenticated;

grant select (
  id, partner_id, active
) on public.shops to anon, authenticated;
