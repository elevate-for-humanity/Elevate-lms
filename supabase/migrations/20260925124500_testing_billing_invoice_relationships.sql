-- Provider-neutral billing references for testing fulfillment.
alter table public.testing_enforcement
  add column if not exists billing_provider text,
  add column if not exists billing_invoice_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='testing_enforcement_billing_invoice_id_fkey'
  ) then
    alter table public.testing_enforcement
      add constraint testing_enforcement_billing_invoice_id_fkey
      foreign key (billing_invoice_id)
      references public.billing_invoices(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='exam_bookings_provider_invoice_id_fkey'
  ) then
    alter table public.exam_bookings
      add constraint exam_bookings_provider_invoice_id_fkey
      foreign key (provider_invoice_id)
      references public.billing_invoices(id)
      on delete set null
      not valid;
  end if;
end
$$;

alter table public.exam_bookings
  validate constraint exam_bookings_provider_invoice_id_fkey;
