-- Expose only the fields needed by the public microcourse catalog.
-- Keep provider Stripe account identifiers and operational metadata private.
create or replace function public.get_public_microcourse_catalog()
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  category text,
  duration_hours numeric,
  is_free boolean,
  provider_enrollment_url text,
  retail_price_cents integer,
  currency text,
  provider_display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.slug,
    m.title,
    m.description,
    m.category,
    m.duration_hours,
    m.is_free,
    m.provider_enrollment_url,
    m.retail_price_cents,
    m.currency,
    p.display_name
  from public.microcourses m
  join public.microcourse_providers p on p.id = m.provider_id
  where m.status = 'active'
    and p.active
  order by m.category, m.title
$$;

revoke all on function public.get_public_microcourse_catalog() from public;
grant execute on function public.get_public_microcourse_catalog() to anon, authenticated;
