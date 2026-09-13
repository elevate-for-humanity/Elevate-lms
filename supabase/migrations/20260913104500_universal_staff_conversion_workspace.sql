-- Shared applicant-work and compensation system used by staff and program holders.
-- Assignment alone never earns compensation. Qualification requires documented
-- work, enrollment, and any voucher/payment gate defined by the plan.

create table if not exists public.staff_queue_rules (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references auth.users(id) on delete restrict,
  tenant_id uuid references public.lms_organizations(id) on delete restrict,
  accepts_unassigned_applicants boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (staff_user_id, tenant_id)
);

create table if not exists public.conversion_compensation_plans (
  id uuid primary key default gen_random_uuid(),
  beneficiary_user_id uuid not null references auth.users(id) on delete restrict,
  tenant_id uuid references public.lms_organizations(id) on delete restrict,
  plan_type text not null check (plan_type in ('flat_verified_voucher','percentage_collected')),
  flat_amount_cents integer check (flat_amount_cents is null or flat_amount_cents > 0),
  rate_bps integer check (rate_bps is null or rate_bps between 1 and 10000),
  requires_verified_voucher boolean not null default false,
  mou_required boolean not null default true,
  payout_setup_required boolean not null default true,
  status text not null default 'pending_onboarding' check (status in ('pending_onboarding','active','suspended','ended')),
  effective_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check ((plan_type='flat_verified_voucher' and flat_amount_cents is not null and rate_bps is null)
      or (plan_type='percentage_collected' and rate_bps is not null and flat_amount_cents is null))
);

create table if not exists public.applicant_work_claims (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete restrict,
  worker_user_id uuid not null references auth.users(id) on delete restrict,
  tenant_id uuid references public.lms_organizations(id) on delete restrict,
  status text not null default 'assigned' check (status in ('assigned','contacted','working','enrolled','disqualified')),
  work_notes text,
  first_contact_at timestamptz,
  enrolled_at timestamptz,
  enrollment_id uuid references public.program_enrollments(id) on delete restrict,
  voucher_verified_at timestamptz,
  voucher_verified_by uuid references auth.users(id) on delete restrict,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id)
);

create table if not exists public.compensation_ledger (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.conversion_compensation_plans(id) on delete restrict,
  claim_id uuid not null references public.applicant_work_claims(id) on delete restrict,
  beneficiary_user_id uuid not null references auth.users(id) on delete restrict,
  source_event_id text not null,
  event_type text not null check (event_type in ('verified_voucher_enrollment','deposit','weekly_payment','refund','chargeback')),
  gross_amount_cents integer,
  amount_cents integer not null check (amount_cents <> 0),
  status text not null default 'held' check (status in ('held','accrued','approved','processing','paid','reversed')),
  payable_reason text,
  reverses_ledger_id uuid references public.compensation_ledger(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (plan_id, source_event_id, event_type)
);

create table if not exists public.staff_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,
  title text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','complete','blocked')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (staff_user_id, task_key)
);

alter table public.staff_queue_rules enable row level security;
alter table public.conversion_compensation_plans enable row level security;
alter table public.applicant_work_claims enable row level security;
alter table public.compensation_ledger enable row level security;
alter table public.staff_onboarding_tasks enable row level security;

create policy staff_queue_rules_read_own on public.staff_queue_rules for select to authenticated
  using (staff_user_id = (select auth.uid()));
create policy compensation_plans_read_own on public.conversion_compensation_plans for select to authenticated
  using (beneficiary_user_id = (select auth.uid()));
create policy applicant_claims_read_own on public.applicant_work_claims for select to authenticated
  using (worker_user_id = (select auth.uid()));
create policy compensation_ledger_read_own on public.compensation_ledger for select to authenticated
  using (beneficiary_user_id = (select auth.uid()));
create policy staff_tasks_read_own on public.staff_onboarding_tasks for select to authenticated
  using (staff_user_id = (select auth.uid()));

revoke all on public.staff_queue_rules, public.conversion_compensation_plans,
  public.applicant_work_claims, public.compensation_ledger, public.staff_onboarding_tasks from anon;
grant select on public.staff_queue_rules, public.conversion_compensation_plans,
  public.applicant_work_claims, public.compensation_ledger, public.staff_onboarding_tasks to authenticated;
grant all on public.staff_queue_rules, public.conversion_compensation_plans,
  public.applicant_work_claims, public.compensation_ledger, public.staff_onboarding_tasks to service_role;

create or replace function public.route_unassigned_applicant_to_staff()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_staff uuid;
begin
  if new.advisor_assigned is not null then return new; end if;
  if exists (
    select 1 from public.program_holder_programs php
    join public.program_holders ph on ph.id=php.program_holder_id
    where php.program_id=new.program_id and coalesce(php.status,'active')='active'
      and coalesce(ph.status,'active')='active'
  ) then return new; end if;
  select r.staff_user_id into v_staff from public.staff_queue_rules r
   where r.active and r.accepts_unassigned_applicants
     and r.tenant_id is null
   order by r.created_at, r.id limit 1;
  new.advisor_assigned := v_staff;
  return new;
end $$;

drop trigger if exists route_unassigned_applicant_to_staff on public.applications;
create trigger route_unassigned_applicant_to_staff before insert or update of program_id
on public.applications for each row execute function public.route_unassigned_applicant_to_staff();
revoke all on function public.route_unassigned_applicant_to_staff() from public;

comment on table public.applicant_work_claims is 'Auditable proof of who worked and enrolled an applicant; routing alone is not commission qualification.';
comment on table public.compensation_ledger is 'Idempotent universal ledger. Financial events are held until MOU, payout setup, and plan-specific gates pass.';
