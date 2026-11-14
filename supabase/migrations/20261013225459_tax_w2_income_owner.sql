-- Assign each wage statement to the correct filer without changing its access policy.
alter table public.tax_w2_income add column if not exists income_owner text not null default 'primary';
alter table public.tax_w2_income drop constraint if exists tax_w2_income_owner_check;
alter table public.tax_w2_income add constraint tax_w2_income_owner_check check (income_owner in ('primary','spouse'));
