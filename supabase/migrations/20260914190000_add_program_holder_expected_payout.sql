-- Keep projected Program Holder compensation separate from actual payout schedules.
-- A projected amount must never imply that a voucher was verified or funds were received.
alter table public.program_holder_students
  add column if not exists expected_payout_cents bigint not null default 0,
  add column if not exists expected_payout_status text not null default 'not_projected';

alter table public.program_holder_students
  drop constraint if exists program_holder_students_expected_payout_status_check;

alter table public.program_holder_students
  add constraint program_holder_students_expected_payout_status_check
  check (
    expected_payout_status in (
      'not_projected',
      'pending_voucher_payment',
      'eligible',
      'paid',
      'cancelled'
    )
  );

comment on column public.program_holder_students.expected_payout_cents is
  'Projected provider compensation only; actual payable funds require an enrollment-linked payout schedule.';
comment on column public.program_holder_students.expected_payout_status is
  'Projection state kept separate from voucher verification, receipt of funds, and payout execution.';
