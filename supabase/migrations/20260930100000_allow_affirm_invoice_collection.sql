alter table public.billing_invoices
  drop constraint if exists billing_invoices_collection_provider_check;

alter table public.billing_invoices
  add constraint billing_invoices_collection_provider_check
  check (collection_provider is null or collection_provider in ('paypal', 'affirm'));

comment on column public.billing_invoices.collection_provider is
  'Provider that collected payment for a QuickBooks invoice. Supported values are PayPal and Affirm.';

alter table public.billing_provider_events
  drop constraint if exists billing_provider_events_provider_check;

alter table public.billing_provider_events
  add constraint billing_provider_events_provider_check
  check (provider in ('paypal', 'quickbooks', 'affirm'));
