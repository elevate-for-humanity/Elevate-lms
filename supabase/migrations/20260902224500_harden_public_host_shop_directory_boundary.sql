-- The partners RLS graph references private authorization tables, so a public
-- SECURITY INVOKER directory would require inappropriate cascading grants.
-- Keep the public view as a tightly filtered projection and revoke the temporary
-- source-column access added while validating the invoker design.

alter view public.public_host_shops set (security_invoker = false);

revoke select (id, public_slug, dba, shop_name, name, description, logo_url, flyer_url,
  website_url, website, phone, address_line1, address_line2, city, state, zip,
  programs, featured, display_order, public_profile_published_at, media_gallery,
  video_url, source_url, google_maps_url, media_verified_at,
  approval_status, status, is_active) on public.partners from anon, authenticated;
revoke select (
  partner_id, shop_id, status, portal_access_enabled, directory_listing
) on public.host_shop_partnerships from anon, authenticated;
revoke select (id, partner_id, active) on public.shops from anon, authenticated;

grant select on public.public_host_shops to anon, authenticated;
