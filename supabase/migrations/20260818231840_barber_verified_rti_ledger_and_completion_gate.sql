-- Verified Related Technical Instruction ledger for registered apprenticeship.
-- Digital lesson completion is learning progress, not automatically RTI credit.

create table if not exists public.apprenticeship_rti_entries (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  standard_key text not null references public.apprenticeship_standard_versions(standard_key),
  requirement_id uuid not null references public.apprenticeship_rti_requirements(id),
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.course_lessons(id) on delete set null,
  instruction_date date not null,
  delivery_method text not null check (delivery_method in ('lms','classroom','live_virtual','lab','external_approved')),
  minutes_claimed integer not null check (minutes_claimed > 0 and minutes_claimed <= 720),
  minutes_verified integer check (minutes_verified is null or (minutes_verified > 0 and minutes_verified <= minutes_claimed)),
  evidence_url text,
  evidence_notes text,
  instructor_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id, instruction_date, requirement_id, lesson_id, delivery_method)
);

create index if not exists idx_rti_entries_user_status on public.apprenticeship_rti_entries(user_id,status);
create index if not exists idx_rti_entries_enrollment_requirement on public.apprenticeship_rti_entries(enrollment_id,requirement_id,status);

alter table public.apprenticeship_rti_entries enable row level security;
revoke all on public.apprenticeship_rti_entries from anon;
grant select, insert on public.apprenticeship_rti_entries to authenticated;
grant select, insert, update, delete on public.apprenticeship_rti_entries to service_role;

drop policy if exists rti_entries_apprentice_select on public.apprenticeship_rti_entries;
create policy rti_entries_apprentice_select on public.apprenticeship_rti_entries
for select to authenticated using (user_id = auth.uid() or exists (
  select 1 from public.profiles p where p.id=auth.uid() and lower(coalesce(p.role::text,'')) in ('admin','super_admin','staff','instructor')
));

drop policy if exists rti_entries_apprentice_insert on public.apprenticeship_rti_entries;
create policy rti_entries_apprentice_insert on public.apprenticeship_rti_entries
for insert to authenticated with check (
  user_id = auth.uid()
  and status='pending'
  and verified_by is null
  and verified_at is null
  and exists (
    select 1 from public.program_enrollments pe
    where pe.id=enrollment_id and pe.user_id=auth.uid() and pe.program_slug='barber-apprenticeship'
  )
);

create or replace function public.verify_apprenticeship_rti_entry(
  p_entry_id uuid,
  p_minutes_verified integer,
  p_decision text,
  p_notes text default null
) returns public.apprenticeship_rti_entries
language plpgsql
security definer
set search_path=public
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_row public.apprenticeship_rti_entries%rowtype;
begin
  if auth.role() <> 'service_role' then
    if v_actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
    select lower(coalesce(role::text,'')) into v_role from public.profiles where id=v_actor;
    if v_role not in ('admin','super_admin','staff','instructor') then
      raise exception 'Sponsor staff or instructor role required' using errcode='42501';
    end if;
  end if;
  if p_decision not in ('verified','rejected') then raise exception 'Invalid decision' using errcode='22023'; end if;
  select * into v_row from public.apprenticeship_rti_entries where id=p_entry_id for update;
  if not found then raise exception 'RTI entry not found' using errcode='P0002'; end if;
  if p_decision='verified' and (p_minutes_verified is null or p_minutes_verified<=0 or p_minutes_verified>v_row.minutes_claimed) then
    raise exception 'Verified minutes must be between 1 and claimed minutes' using errcode='22023';
  end if;
  update public.apprenticeship_rti_entries
  set status=p_decision,
      minutes_verified=case when p_decision='verified' then p_minutes_verified else null end,
      verified_by=coalesce(v_actor,verified_by),
      verified_at=now(),
      evidence_notes=coalesce(p_notes,evidence_notes),
      rejection_reason=case when p_decision='rejected' then coalesce(p_notes,'Rejected by reviewer') else null end,
      updated_at=now()
  where id=p_entry_id returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.verify_apprenticeship_rti_entry(uuid,integer,text,text) from public,anon;
grant execute on function public.verify_apprenticeship_rti_entry(uuid,integer,text,text) to authenticated,service_role;

create or replace view public.barber_appendix_a_rti_progress
with (security_invoker=true) as
select
  pe.id enrollment_id,
  pe.user_id apprentice_user_id,
  r.id requirement_id,
  r.title requirement_title,
  r.required_hours,
  coalesce(round(sum(case when e.status='verified' then e.minutes_verified else 0 end)/60.0,2),0) verified_hours,
  greatest(r.required_hours - coalesce(round(sum(case when e.status='verified' then e.minutes_verified else 0 end)/60.0,2),0),0) remaining_hours,
  count(e.id) filter (where e.status='pending') pending_entries,
  (coalesce(sum(case when e.status='verified' then e.minutes_verified else 0 end),0) >= r.required_hours*60) requirement_met
from public.program_enrollments pe
join public.apprenticeship_standard_versions sv on sv.program_slug=pe.program_slug and sv.is_active=true
join public.apprenticeship_rti_requirements r on r.standard_key=sv.standard_key
left join public.apprenticeship_rti_entries e on e.enrollment_id=pe.id and e.requirement_id=r.id
where pe.program_slug='barber-apprenticeship'
group by pe.id,pe.user_id,r.id,r.title,r.required_hours,r.display_order
order by pe.id,r.display_order;

grant select on public.barber_appendix_a_rti_progress to authenticated,service_role;

create or replace view public.barber_appendix_a_completion_readiness
with (security_invoker=true) as
with competency as (
  select pe.id enrollment_id, count(distinct acr.competency_id) filter (where acr.completed=true) completed_competencies
  from public.program_enrollments pe
  left join public.apprentice_competency_records acr on acr.enrollment_id=pe.id
  where pe.program_slug='barber-apprenticeship'
  group by pe.id
), rti as (
  select enrollment_id, coalesce(sum(verified_hours),0) verified_rti_hours, bool_and(requirement_met) rti_categories_met
  from public.barber_appendix_a_rti_progress group by enrollment_id
), placement as (
  select pe.id enrollment_id,
         bool_or(ap.status='active' and ap.shop_id is not null and ap.supervisor_user_id is not null) has_supervised_placement
  from public.program_enrollments pe
  left join public.apprentice_placements ap on ap.student_id=pe.user_id and ap.program_slug=pe.program_slug
  where pe.program_slug='barber-apprenticeship'
  group by pe.id
)
select pe.id enrollment_id, pe.user_id apprentice_user_id,
       coalesce(c.completed_competencies,0) completed_competencies,
       14 required_competencies,
       coalesce(r.verified_rti_hours,0) verified_rti_hours,
       260 required_rti_hours,
       coalesce(r.rti_categories_met,false) rti_categories_met,
       coalesce(pl.has_supervised_placement,false) has_supervised_placement,
       (coalesce(c.completed_competencies,0)>=14 and coalesce(r.verified_rti_hours,0)>=260 and coalesce(r.rti_categories_met,false) and coalesce(pl.has_supervised_placement,false)) completion_ready
from public.program_enrollments pe
left join competency c on c.enrollment_id=pe.id
left join rti r on r.enrollment_id=pe.id
left join placement pl on pl.enrollment_id=pe.id
where pe.program_slug='barber-apprenticeship';

grant select on public.barber_appendix_a_completion_readiness to authenticated,service_role;
