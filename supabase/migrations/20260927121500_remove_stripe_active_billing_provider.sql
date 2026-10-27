-- Remove Stripe from active billing provider constraints.
-- Historical Stripe identifiers remain in legacy columns for reconciliation only.

alter table public.billing_invoices
  drop constraint if exists billing_invoices_provider_check;
alter table public.billing_invoices
  add constraint billing_invoices_provider_check
  check (provider in ('quickbooks', 'paypal'));

alter table public.billing_schedules
  drop constraint if exists billing_schedules_provider_check;
alter table public.billing_schedules
  add constraint billing_schedules_provider_check
  check (provider in ('quickbooks', 'paypal'));

update public.platform_settings
set value = 'quickbooks'
where key = 'billing_provider'
  and lower(coalesce(value, '')) = 'stripe';

delete from public.platform_settings
where key = 'stripe_billing_mode';
