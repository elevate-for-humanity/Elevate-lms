alter table public.enrollment_funding_records add column if not exists authorization_date date;
comment on column public.enrollment_funding_records.authorization_date is 'Documented funding authorization date; null while pending or unsupported by source evidence.';
