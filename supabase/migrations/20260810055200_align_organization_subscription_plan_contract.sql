alter table public.organization_subscriptions
  add column if not exists plan_id uuid references public.subscription_plans(id),
  add column if not exists billing_interval text;

update public.organization_subscriptions os
set plan_id = sp.id
from public.subscription_plans sp
where os.plan_id is null and sp.slug = os.plan_type;

alter table public.organization_subscriptions drop constraint if exists valid_plan_type;
alter table public.organization_subscriptions
  add constraint valid_plan_type check (
    plan_type = any (array['free'::text,'starter'::text,'solo'::text,'business'::text,'professional'::text,'enterprise'::text,'custom'::text])
  );

alter table public.organization_subscriptions
  add constraint organization_subscriptions_billing_interval_check
  check (billing_interval is null or billing_interval = any (array['month'::text,'year'::text]));

create index if not exists organization_subscriptions_plan_id_idx
  on public.organization_subscriptions(plan_id);
