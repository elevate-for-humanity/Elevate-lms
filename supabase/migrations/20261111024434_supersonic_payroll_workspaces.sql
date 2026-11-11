-- Supersonic preparation ledger. No bank numbers, SSNs, payment execution or
-- tax-filing status are stored or inferred here. All writes use the MFA- and
-- office-owner-checked server routes. School payroll tables are not reused.
create table public.sfc_payroll_companies (
 id uuid primary key default gen_random_uuid(),
 office_id uuid not null references public.tax_offices(id),
 legal_name text not null check(length(legal_name) between 1 and 160),
 frequency text not null check(frequency in ('weekly','biweekly','semimonthly','monthly')),
 employees jsonb not null default '[]'::jsonb check(jsonb_typeof(employees)='array' and jsonb_array_length(employees)<=100),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index sfc_payroll_companies_office on public.sfc_payroll_companies(office_id);
create table public.sfc_payroll_runs (
 id uuid primary key,
 company_id uuid not null references public.sfc_payroll_companies(id),
 period_start date not null, period_end date not null, pay_date date not null,
 input jsonb not null, calculation jsonb not null,
 source_version integer not null, version integer not null default 1,
 status text not null default 'draft' check(status in ('draft','approved_for_export','voided')),
 created_by uuid not null references auth.users(id),
 approved_by uuid references auth.users(id), approved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(period_start<=period_end and period_end<=pay_date),
 check(period_start>='2026-10-01' and pay_date<='2026-12-31'),
 check(calculation @> '{"paymentsSent":false,"taxesFiled":false}'::jsonb),
 check(status!='approved_for_export' or (approved_by is not null and approved_at is not null))
);
create unique index sfc_payroll_one_period on public.sfc_payroll_runs(company_id,period_start,period_end,pay_date) where status!='voided';
create index sfc_payroll_runs_company_date on public.sfc_payroll_runs(company_id,pay_date desc);
create table public.sfc_payroll_events (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.sfc_payroll_companies(id),
 run_id uuid not null references public.sfc_payroll_runs(id),
 actor_id uuid not null references auth.users(id),
 action text not null check(action in ('draft_saved','approved_for_export','voided')),
 created_at timestamptz not null default now()
);
create index sfc_payroll_events_run on public.sfc_payroll_events(run_id,created_at);
alter table public.sfc_payroll_companies enable row level security;
alter table public.sfc_payroll_runs enable row level security;
alter table public.sfc_payroll_events enable row level security;
revoke all on public.sfc_payroll_companies,public.sfc_payroll_runs,public.sfc_payroll_events from public,anon,authenticated;
grant select,insert,update on public.sfc_payroll_companies,public.sfc_payroll_runs to service_role;
grant select,insert on public.sfc_payroll_events to service_role;

-- Retain reviewed snapshots even if a later server bug attempts a direct update.
create function public.sfc_preserve_payroll_review() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if tg_op='DELETE' then raise exception 'PAYROLL_HISTORY_IS_PERMANENT'; end if;
 if old.status='voided' then raise exception 'PAYROLL_HISTORY_IS_PERMANENT'; end if;
 if old.status='approved_for_export' and (
  new.status<>'voided' or new.version<>old.version+1 or
  (to_jsonb(new)-array['status','version','updated_at']) is distinct from
  (to_jsonb(old)-array['status','version','updated_at'])
 ) then raise exception 'APPROVED_PAYROLL_IS_IMMUTABLE'; end if;
 return new;
end; $$;
revoke all on function public.sfc_preserve_payroll_review() from public,anon,authenticated;
grant execute on function public.sfc_preserve_payroll_review() to service_role;
create trigger sfc_payroll_review_retention before update or delete on public.sfc_payroll_runs
for each row execute function public.sfc_preserve_payroll_review();

-- Company lock makes profile revision verification and draft/approval writes
-- atomic. Parameters never authorize access: the saved office owner is checked.
create function public.sfc_save_payroll_run(p_actor uuid,p_company uuid,p_source_version integer,p_run uuid,p_expected_version integer,p_input jsonb,p_calculation jsonb)
returns public.sfc_payroll_runs language plpgsql security invoker set search_path=public,pg_temp as $$
declare c public.sfc_payroll_companies; r public.sfc_payroll_runs;
begin
 select * into c from public.sfc_payroll_companies where id=p_company for update;
 if not found or not exists(select 1 from public.tax_offices where id=c.office_id and owner_id=p_actor and status='active') then raise exception 'PAYROLL_ACCESS_REQUIRED'; end if;
 if c.version<>p_source_version then raise exception 'PAYROLL_PROFILE_CHANGED'; end if;
 if p_calculation->>'version' is distinct from 'sfc-periodic-IN-2026.1' or not(p_calculation @> '{"paymentsSent":false,"taxesFiled":false}'::jsonb) then raise exception 'INVALID_PAYROLL_CALCULATION'; end if;
 select * into r from public.sfc_payroll_runs where id=p_run for update;
 if found then
  if r.company_id<>p_company or r.status<>'draft' or r.version is distinct from p_expected_version then raise exception 'PAYROLL_RUN_CHANGED'; end if;
  update public.sfc_payroll_runs set input=p_input,calculation=p_calculation,source_version=c.version,version=version+1,period_start=(p_input->>'periodStart')::date,period_end=(p_input->>'periodEnd')::date,pay_date=(p_input->>'payDate')::date,updated_at=now() where id=p_run returning * into r;
 else
  if p_expected_version is not null then raise exception 'PAYROLL_RUN_CHANGED'; end if;
  insert into public.sfc_payroll_runs(id,company_id,period_start,period_end,pay_date,input,calculation,source_version,created_by)
   values(p_run,p_company,(p_input->>'periodStart')::date,(p_input->>'periodEnd')::date,(p_input->>'payDate')::date,p_input,p_calculation,c.version,p_actor) returning * into r;
 end if;
 insert into public.sfc_payroll_events(company_id,run_id,actor_id,action) values(p_company,r.id,p_actor,'draft_saved');
 return r;
end; $$;
create function public.sfc_review_payroll_run(p_actor uuid,p_company uuid,p_run uuid,p_expected_version integer,p_action text)
returns public.sfc_payroll_runs language plpgsql security invoker set search_path=public,pg_temp as $$
declare c public.sfc_payroll_companies; r public.sfc_payroll_runs;
begin
 select * into c from public.sfc_payroll_companies where id=p_company for update;
 if not found or not exists(select 1 from public.tax_offices where id=c.office_id and owner_id=p_actor and status='active') then raise exception 'PAYROLL_ACCESS_REQUIRED'; end if;
 select * into r from public.sfc_payroll_runs where id=p_run and company_id=p_company for update;
 if not found or r.version<>p_expected_version then raise exception 'PAYROLL_RUN_CHANGED'; end if;
 if p_action='approve' then
  if r.status<>'draft' or r.source_version<>c.version then raise exception 'PAYROLL_PROFILE_CHANGED'; end if;
  update public.sfc_payroll_runs set status='approved_for_export',approved_by=p_actor,approved_at=now(),version=version+1,updated_at=now() where id=r.id returning * into r;
 elsif p_action='void' and r.status in ('draft','approved_for_export') then
  update public.sfc_payroll_runs set status='voided',version=version+1,updated_at=now() where id=r.id returning * into r;
 else raise exception 'INVALID_PAYROLL_TRANSITION'; end if;
 insert into public.sfc_payroll_events(company_id,run_id,actor_id,action) values(p_company,r.id,p_actor,r.status);
 return r;
end; $$;
revoke all on function public.sfc_save_payroll_run(uuid,uuid,integer,uuid,integer,jsonb,jsonb),public.sfc_review_payroll_run(uuid,uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.sfc_save_payroll_run(uuid,uuid,integer,uuid,integer,jsonb,jsonb),public.sfc_review_payroll_run(uuid,uuid,uuid,integer,text) to service_role;
