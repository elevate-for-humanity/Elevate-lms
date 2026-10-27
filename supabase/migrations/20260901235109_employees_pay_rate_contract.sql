alter table public.employees
  add column if not exists pay_rate_cents bigint;

alter table public.employees
  drop constraint if exists employees_pay_rate_cents_nonnegative;

alter table public.employees
  add constraint employees_pay_rate_cents_nonnegative
  check (pay_rate_cents is null or pay_rate_cents >= 0);

notify pgrst, 'reload schema';
