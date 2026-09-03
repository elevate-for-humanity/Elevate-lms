alter table public.host_shop_applications
  add column if not exists application_fee_status text not null default 'not_required',
  add column if not exists application_fee_amount_cents integer,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists application_fee_paid_at timestamptz;

alter table public.host_shop_applications
  add constraint host_shop_applications_fee_status_check
  check (application_fee_status = any (array['not_required'::text,'pending'::text,'paid'::text,'refunded'::text,'failed'::text]));

create unique index if not exists host_shop_applications_stripe_session_uidx
  on public.host_shop_applications(stripe_session_id)
  where stripe_session_id is not null;

create unique index if not exists host_shop_applications_payment_intent_uidx
  on public.host_shop_applications(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
