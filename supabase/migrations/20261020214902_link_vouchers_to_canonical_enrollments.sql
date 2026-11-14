alter table public.ita_vouchers add column if not exists enrollment_id uuid references public.program_enrollments(id);
create index if not exists ita_vouchers_enrollment_id_idx on public.ita_vouchers(enrollment_id);
comment on column public.ita_vouchers.enrollment_id is 'Canonical enrollment link, including documented voucher students whose login account has not yet been matched.';
