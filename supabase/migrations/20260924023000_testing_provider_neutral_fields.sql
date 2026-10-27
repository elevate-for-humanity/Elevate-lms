-- Provider-neutral Testing Center payment references.
alter table if exists public.exam_bookings
  add column if not exists billing_invoice_id uuid references public.billing_invoices(id) on delete set null;

alter table if exists public.testing_enforcement
  add column if not exists payment_provider text,
  add column if not exists provider_invoice_id uuid references public.billing_invoices(id) on delete set null;

create index if not exists exam_bookings_billing_invoice_idx
  on public.exam_bookings (billing_invoice_id)
  where billing_invoice_id is not null;

create index if not exists testing_enforcement_provider_invoice_idx
  on public.testing_enforcement (provider_invoice_id)
  where provider_invoice_id is not null;
