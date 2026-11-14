-- Student-scoped Program Holder commissions.
-- A routed applicant is never commissionable by itself. Eligibility begins only
-- after the assigned Program Holder documents the call and completes enrollment.

alter table public.program_holder_students
  add column if not exists next_follow_up date,
  add column if not exists work_start_date date,
  add column if not exists work_site text,
  add column if not exists call_notes text,
  add column if not exists call_date timestamptz,
  add column if not exists call_outcome text;

create table if not exists public.program_holder_commission_agreements (
  id uuid primary key default gen_random_uuid(),
  program_holder_id uuid not null references public.program_holders(id) on delete restrict,
  program_holder_student_id uuid not null references public.program_holder_students(id) on delete restrict,
  enrollment_id uuid references public.program_enrollments(id) on delete restrict,
  student_user_id uuid references auth.users(id) on delete restrict,
  commission_rate_bps integer not null default 3000 check (commission_rate_bps between 0 and 10000),
  status text not null default 'active' check (status in ('active','suspended','ended')),
  qualification_source text not null default 'holder_enrollment'
    check (qualification_source = 'holder_enrollment'),
  qualified_by uuid not null references auth.users(id) on delete restrict,
  qualified_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_holder_id, program_holder_student_id)
);

create unique index if not exists program_holder_commission_agreements_enrollment_key
  on public.program_holder_commission_agreements(program_holder_id, enrollment_id)
  where enrollment_id is not null and status = 'active';

create table if not exists public.program_holder_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.program_holder_commission_agreements(id) on delete restrict,
  program_holder_id uuid not null references public.program_holders(id) on delete restrict,
  enrollment_id uuid references public.program_enrollments(id) on delete restrict,
  provider text not null check (provider in ('quickbooks','paypal','manual')),
  provider_event_id text not null,
  payment_kind text not null check (payment_kind in ('deposit','weekly','refund','chargeback')),
  gross_amount_cents integer not null check (gross_amount_cents > 0),
  commission_rate_bps integer not null check (commission_rate_bps between 0 and 10000),
  commission_amount_cents integer not null check (commission_amount_cents > 0),
  status text not null default 'accrued' check (status in ('accrued','approved','processing','paid','reversed','held')),
  reverses_ledger_id uuid references public.program_holder_commission_ledger(id) on delete restrict,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id, payment_kind)
);

create index if not exists program_holder_commission_ledger_holder_status
  on public.program_holder_commission_ledger(program_holder_id, status, occurred_at desc);

alter table public.program_holder_commission_agreements enable row level security;
alter table public.program_holder_commission_ledger enable row level security;

create policy program_holder_commission_agreements_read_own
  on public.program_holder_commission_agreements for select to authenticated
  using (program_holder_id = public.current_program_holder_id());
create policy program_holder_commission_ledger_read_own
  on public.program_holder_commission_ledger for select to authenticated
  using (program_holder_id = public.current_program_holder_id());

revoke all on public.program_holder_commission_agreements from anon;
revoke all on public.program_holder_commission_ledger from anon;
grant select on public.program_holder_commission_agreements to authenticated;
grant select on public.program_holder_commission_ledger to authenticated;
grant all on public.program_holder_commission_agreements to service_role;
grant all on public.program_holder_commission_ledger to service_role;

comment on table public.program_holder_commission_agreements is
  'Explicit commission eligibility created only when a Program Holder documents and enrolls the applicant.';
comment on table public.program_holder_commission_ledger is
  'Idempotent 30% commission ledger for successful deposit and weekly payments, with refund reversals.';
