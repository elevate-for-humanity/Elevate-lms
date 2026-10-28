-- Payroll setup and evidence tracking. These records never move money.
-- All access goes through authenticated, partner-scoped server actions.
create table if not exists public.host_shop_payroll_settings (
  partner_id uuid primary key references public.partners(id),
  service text not null check (service in ('own','elevate')),
  provider_name text not null,
  pay_frequency text not null check (pay_frequency in ('weekly','biweekly','semimonthly','monthly')),
  status text not null check (status in ('host_managed','setup_requested','active')),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
create table if not exists public.host_shop_payroll_plans (
  placement_id uuid primary key references public.apprentice_placements(id),
  partner_id uuid not null references public.partners(id),
  pay_method text not null check (pay_method in ('hourly','commission','hourly_plus_commission')),
  use_appendix boolean not null default true,
  hourly_rate numeric(12,2) check (hourly_rate > 0),
  commission_percent numeric(6,3) check (commission_percent > 0 and commission_percent <= 100),
  effective_date date not null,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  check (pay_method = 'commission' or use_appendix or hourly_rate is not null),
  check (pay_method = 'hourly' or commission_percent is not null)
);
create index if not exists host_shop_payroll_plans_partner on public.host_shop_payroll_plans(partner_id);
create table if not exists public.host_shop_payroll_payments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  placement_id uuid not null references public.apprentice_placements(id),
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  paid_date date not null check (paid_date >= period_start),
  hours_worked numeric(10,2) not null check (hours_worked > 0 and hours_worked <= 744),
  gross_pay numeric(14,2) not null check (gross_pay > 0),
  reference text not null,
  required_hourly_rate numeric(12,2),
  status text not null default 'reported_paid' check (status in ('reported_paid','evidence_verified','correction_requested')),
  evidence_path text not null,
  reported_by uuid not null references auth.users(id),
  reported_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  unique(placement_id,period_start,period_end,reference)
);
create index if not exists host_shop_payroll_payments_partner on public.host_shop_payroll_payments(partner_id,paid_date desc);
alter table public.host_shop_payroll_settings enable row level security;
alter table public.host_shop_payroll_plans enable row level security;
alter table public.host_shop_payroll_payments enable row level security;
revoke all on public.host_shop_payroll_settings,public.host_shop_payroll_plans,public.host_shop_payroll_payments from public,anon,authenticated;
grant all on public.host_shop_payroll_settings,public.host_shop_payroll_plans,public.host_shop_payroll_payments to service_role;
