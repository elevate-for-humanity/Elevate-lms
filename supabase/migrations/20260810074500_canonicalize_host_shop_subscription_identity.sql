alter table public.host_shop_partnerships
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists shop_id uuid references public.shops(id) on delete set null,
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create unique index if not exists host_shop_partnerships_partner_uidx
  on public.host_shop_partnerships(partner_id)
  where partner_id is not null;

create unique index if not exists host_shop_partnerships_shop_uidx
  on public.host_shop_partnerships(shop_id)
  where shop_id is not null;

create unique index if not exists host_shop_partnerships_stripe_subscription_uidx
  on public.host_shop_partnerships(stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists host_shop_partnerships_owner_idx
  on public.host_shop_partnerships(owner_id)
  where owner_id is not null;
