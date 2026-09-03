-- Canonical Host Shop identity bridge.
--
-- partner_users authenticates a user into a partner record while
-- apprentice_placements points at shops. Without an explicit relationship,
-- an authenticated Host Shop can legitimately see zero placements simply
-- because shop_staff was never populated. Keep the new FK nullable for
-- backward compatibility and only backfill unambiguous identity matches.

alter table public.shops
  add column if not exists partner_id uuid references public.partners(id) on delete set null;

create index if not exists idx_shops_partner_id on public.shops(partner_id);

with candidates as (
  select
    s.id as shop_id,
    p.id as partner_id,
    count(*) over (partition by s.id) as match_count
  from public.shops s
  join public.partners p
    on (
      regexp_replace(lower(coalesce(s.name, '')), '[^a-z0-9]+', '', 'g') =
      regexp_replace(lower(coalesce(nullif(p.shop_name, ''), nullif(p.dba, ''), p.name, '')), '[^a-z0-9]+', '', 'g')
    )
    or (
      nullif(regexp_replace(coalesce(s.phone, ''), '[^0-9]+', '', 'g'), '') is not null
      and regexp_replace(coalesce(s.phone, ''), '[^0-9]+', '', 'g') =
          regexp_replace(coalesce(nullif(p.contact_phone, ''), p.phone, ''), '[^0-9]+', '', 'g')
      and coalesce(s.zip, '') <> ''
      and coalesce(s.zip, '') = coalesce(p.zip, '')
    )
)
update public.shops s
set partner_id = c.partner_id
from candidates c
where s.id = c.shop_id
  and s.partner_id is null
  and c.match_count = 1;

comment on column public.shops.partner_id is
  'Canonical host-shop relationship to partners. Portal authorization and apprenticeship placement reporting must use this relationship instead of name matching.';
