-- Apprentice tuition collection is orchestrated by the Admin subscription
-- record, collected by PayPal, and mirrored into QuickBooks. No card or bank
-- credentials are stored in Elevate.

alter table public.billing_invoices
  drop constraint if exists billing_invoices_provider_check;
alter table public.billing_invoices
  add constraint billing_invoices_provider_check
  check (provider in ('quickbooks', 'paypal', 'stripe'));

alter table public.billing_schedules
  drop constraint if exists billing_schedules_provider_check;
alter table public.billing_schedules
  add constraint billing_schedules_provider_check
  check (provider in ('quickbooks', 'paypal', 'stripe'));

alter table public.billing_schedules
  add column if not exists collection_mode text not null default 'automatic'
    check (collection_mode in ('automatic', 'manual_invoice')),
  add column if not exists collection_provider text not null default 'paypal'
    check (collection_provider in ('paypal', 'none')),
  add column if not exists provider_product_id text,
  add column if not exists provider_plan_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_status text not null default 'not_configured'
    check (provider_status in (
      'not_configured', 'approval_pending', 'active', 'suspended', 'canceled',
      'expired', 'failed'
    )),
  add column if not exists provider_approval_url text,
  add column if not exists activated_at timestamptz,
  add column if not exists last_provider_sync_at timestamptz;

create unique index if not exists billing_schedules_provider_subscription_uidx
  on public.billing_schedules (collection_provider, provider_subscription_id)
  where provider_subscription_id is not null;

alter table public.billing_invoices
  add column if not exists billing_schedule_id uuid
    references public.billing_schedules(id) on delete set null,
  add column if not exists collection_provider text
    check (collection_provider is null or collection_provider in ('paypal')),
  add column if not exists provider_payment_id text,
  add column if not exists provider_payment_status text;

create unique index if not exists billing_invoices_provider_payment_uidx
  on public.billing_invoices (collection_provider, provider_payment_id)
  where provider_payment_id is not null;

alter table public.billing_migration_authorizations
  add column if not exists authorization_scope text not null default 'recurring_tuition'
    check (authorization_scope in ('recurring_tuition')),
  add column if not exists authorization_method text not null default 'signed_release'
    check (authorization_method in ('signed_release', 'paypal_agreement', 'both')),
  add column if not exists provider_agreement_id text;

create table if not exists public.billing_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('paypal', 'quickbooks')),
  provider_event_id text not null,
  event_type text not null,
  resource_id text,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'ignored', 'failed')),
  attempts integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists billing_provider_events_status_idx
  on public.billing_provider_events (provider, status, created_at);
alter table public.billing_provider_events enable row level security;
revoke all on public.billing_provider_events from anon, authenticated;

create or replace function public.enforce_automatic_billing_activation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'active' and new.collection_mode = 'automatic' then
    if new.collection_provider <> 'paypal'
      or new.provider_subscription_id is null
      or new.provider_status <> 'active' then
      raise exception 'AUTOPAY_PROVIDER_NOT_ACTIVE';
    end if;

    if not exists (
      select 1
      from public.billing_migration_authorizations billing_auth
      where billing_auth.billing_schedule_id = new.id
        and billing_auth.status = 'approved'
        and billing_auth.authorization_scope = 'recurring_tuition'
    ) then
      raise exception 'AUTOPAY_AUTHORIZATION_NOT_APPROVED';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_automatic_billing_activation
  on public.billing_schedules;
create trigger enforce_automatic_billing_activation
before insert or update of status, collection_mode, collection_provider,
  provider_subscription_id, provider_status
on public.billing_schedules
for each row execute function public.enforce_automatic_billing_activation();

comment on table public.billing_schedules is
  'Admin subscription authority. PayPal automatically collects approved recurring tuition; QuickBooks is the accounting ledger.';
comment on column public.billing_schedules.provider_approval_url is
  'Short-lived PayPal approval URL. The learner must approve the PayPal billing agreement before automatic collection can activate.';
comment on table public.billing_provider_events is
  'Idempotent provider webhook/reconciliation ledger. Payloads must not contain raw payment credentials.';
