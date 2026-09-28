-- Enforce one accountable training owner for each applicant projection.
-- Regional/site coordinators may observe and coordinate programs, but they are
-- not the training owner and must not receive the primary applicant queue.

create or replace function public.route_application_to_program_holder_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program_id uuid;
  v_holder_id uuid;
  v_name text;
begin
  v_program_id := new.program_id;
  if v_program_id is null then
    select p.id into v_program_id
    from public.programs p
    where p.slug = coalesce(nullif(new.program_slug, ''), nullif(new.pathway_slug, ''))
       or lower(p.title) = lower(coalesce(nullif(new.program_name, ''), nullif(new.program_interest, '')))
    order by coalesce(p.is_active, true) desc, p.created_at asc
    limit 1;
  end if;

  if v_program_id is null then return new; end if;

  select php.program_holder_id into v_holder_id
  from public.program_holder_programs php
  join public.program_holders ph on ph.id = php.program_holder_id
  where php.program_id = v_program_id
    and coalesce(php.status, 'active') = 'active'
    and lower(coalesce(php.role_in_program, 'owner')) = 'owner'
    and lower(coalesce(ph.status, '')) in ('active', 'approved')
  order by coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
  limit 1;

  if v_holder_id is null then return new; end if;
  v_name := coalesce(nullif(new.full_name, ''), nullif(new.name, ''), trim(concat_ws(' ', new.first_name, new.last_name)));

  delete from public.program_holder_students phs
  where phs.application_id = new.id
    and phs.program_holder_id <> v_holder_id
    and lower(coalesce(phs.status, 'applied')) in ('applied', 'applicant', 'pending', 'inactive', 'removed');

  insert into public.program_holder_students (
    program_holder_id, application_id, student_id, user_id, program_id,
    applicant_name, applicant_email, applicant_phone, status,
    application_status, label, created_at, updated_at
  ) values (
    v_holder_id, new.id, new.user_id, new.user_id, v_program_id,
    v_name, new.email, new.phone, 'applied',
    coalesce(nullif(new.status, ''), 'applied'), 'Student application',
    coalesce(new.created_at, now()), now()
  )
  on conflict (program_holder_id, application_id) where application_id is not null
  do update set
    student_id = excluded.student_id,
    user_id = excluded.user_id,
    program_id = excluded.program_id,
    applicant_name = excluded.applicant_name,
    applicant_email = excluded.applicant_email,
    applicant_phone = excluded.applicant_phone,
    application_status = excluded.application_status,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.route_application_to_program_holder_v1() from public;
grant execute on function public.route_application_to_program_holder_v1() to service_role;

create or replace function public.sync_program_holder_assignment_applicants_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_primary_holder_id uuid;
begin
  select php.program_holder_id into v_primary_holder_id
  from public.program_holder_programs php
  join public.program_holders ph on ph.id = php.program_holder_id
  where php.program_id = new.program_id
    and coalesce(php.status, 'active') = 'active'
    and lower(coalesce(php.role_in_program, 'owner')) = 'owner'
    and lower(coalesce(ph.status, '')) in ('active', 'approved')
  order by coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
  limit 1;

  if v_primary_holder_id is distinct from new.program_holder_id then
    return new;
  end if;

  insert into public.program_holder_students (
    program_holder_id, application_id, student_id, user_id, program_id,
    applicant_name, applicant_email, applicant_phone, status,
    application_status, label, created_at, updated_at
  )
  select
    new.program_holder_id, a.id, a.user_id, a.user_id, new.program_id,
    coalesce(nullif(a.full_name, ''), nullif(a.name, ''), trim(concat_ws(' ', a.first_name, a.last_name))),
    a.email, a.phone, 'applied', coalesce(nullif(a.status, ''), 'applied'),
    'Student application', coalesce(a.created_at, now()), now()
  from public.applications a
  where a.program_id = new.program_id
     or a.program_slug = new.program_slug
     or a.pathway_slug = new.program_slug
  on conflict (program_holder_id, application_id) where application_id is not null
  do update set
    program_id = excluded.program_id,
    applicant_name = excluded.applicant_name,
    applicant_email = excluded.applicant_email,
    applicant_phone = excluded.applicant_phone,
    application_status = excluded.application_status,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_program_holder_assignment_applicants_v1() from public;
grant execute on function public.sync_program_holder_assignment_applicants_v1() to service_role;

drop trigger if exists trg_sync_program_holder_assignment_applicants_v1 on public.program_holder_programs;
create trigger trg_sync_program_holder_assignment_applicants_v1
after insert or update of program_holder_id, program_id, program_slug, status, is_primary, role_in_program
on public.program_holder_programs
for each row execute function public.sync_program_holder_assignment_applicants_v1();

-- Ameco's Enterprise / Amiko Martin is the accountable owner for every
-- technology program in her approved scope.
update public.program_holder_programs php
set role_in_program = 'owner',
    is_primary = true
from public.programs p
where php.program_id = p.id
  and php.program_holder_id = (select id from public.program_holders where organization_name = 'Ameco''s Enterprise' order by created_at asc limit 1)
  and p.slug = any(array[
    'information-technology',
    'cad-drafting',
    'graphic-design',
    'software-development',
    'web-development',
    'network-support-technician',
    'network-administration',
    'cybersecurity-analyst',
    'it-help-desk',
    'data-analytics'
  ]);

-- Top Ace is a Texas statewide coordinator pending its MOU, not the training
-- owner. Keep its regional program visibility while preventing owner routing.
update public.program_holder_programs
set role_in_program = 'coordinator',
    is_primary = false
where program_holder_id = (select id from public.program_holders where organization_name = 'Top Ace Solutions' order by created_at asc limit 1);

-- Remove only applicant projections from the pending coordinator. Canonical
-- applications and enrollment records remain untouched.
delete from public.program_holder_students
where program_holder_id = (select id from public.program_holders where organization_name = 'Top Ace Solutions' order by created_at asc limit 1)
  and application_id is not null;

-- Reconcile current applicant projections to the one selected primary owner.
with application_programs as (
  select a.*,
    coalesce(
      a.program_id,
      (
        select p.id
        from public.programs p
        where p.slug = coalesce(nullif(a.program_slug, ''), nullif(a.pathway_slug, ''))
           or lower(p.title) = lower(coalesce(nullif(a.program_name, ''), nullif(a.program_interest, '')))
        order by coalesce(p.is_active, true) desc, p.created_at asc
        limit 1
      )
    ) as resolved_program_id
  from public.applications a
),
primary_owners as (
  select distinct on (php.program_id)
    php.program_id,
    php.program_holder_id
  from public.program_holder_programs php
  join public.program_holders ph on ph.id = php.program_holder_id
  where coalesce(php.status, 'active') = 'active'
    and lower(coalesce(php.role_in_program, 'owner')) = 'owner'
    and lower(coalesce(ph.status, '')) in ('active', 'approved')
  order by php.program_id, coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
)
delete from public.program_holder_students phs
using application_programs a, primary_owners po
where phs.application_id = a.id
  and po.program_id = a.resolved_program_id
  and phs.program_holder_id <> po.program_holder_id
  and lower(coalesce(phs.status, 'applied')) in ('applied', 'applicant', 'pending', 'inactive', 'removed');

with application_programs as (
  select a.*,
    coalesce(
      a.program_id,
      (
        select p.id
        from public.programs p
        where p.slug = coalesce(nullif(a.program_slug, ''), nullif(a.pathway_slug, ''))
           or lower(p.title) = lower(coalesce(nullif(a.program_name, ''), nullif(a.program_interest, '')))
        order by coalesce(p.is_active, true) desc, p.created_at asc
        limit 1
      )
    ) as resolved_program_id
  from public.applications a
),
primary_owners as (
  select distinct on (php.program_id)
    php.program_id,
    php.program_holder_id
  from public.program_holder_programs php
  join public.program_holders ph on ph.id = php.program_holder_id
  where coalesce(php.status, 'active') = 'active'
    and lower(coalesce(php.role_in_program, 'owner')) = 'owner'
    and lower(coalesce(ph.status, '')) in ('active', 'approved')
  order by php.program_id, coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
)
insert into public.program_holder_students (
  program_holder_id, application_id, student_id, user_id, program_id,
  applicant_name, applicant_email, applicant_phone, status,
  application_status, label, created_at, updated_at
)
select
  po.program_holder_id, a.id, a.user_id, a.user_id, a.resolved_program_id,
  coalesce(nullif(a.full_name, ''), nullif(a.name, ''), trim(concat_ws(' ', a.first_name, a.last_name))),
  a.email, a.phone, 'applied', coalesce(nullif(a.status, ''), 'applied'),
  'Student application', coalesce(a.created_at, now()), now()
from application_programs a
join primary_owners po on po.program_id = a.resolved_program_id
where a.resolved_program_id is not null
on conflict (program_holder_id, application_id) where application_id is not null
do update set
  student_id = excluded.student_id,
  user_id = excluded.user_id,
  program_id = excluded.program_id,
  applicant_name = excluded.applicant_name,
  applicant_email = excluded.applicant_email,
  applicant_phone = excluded.applicant_phone,
  application_status = excluded.application_status,
  updated_at = now();

comment on function public.route_application_to_program_holder_v1()
is 'Routes each canonical application to exactly one approved or active primary training owner; coordinators do not receive the owner queue.';

comment on function public.sync_program_holder_assignment_applicants_v1()
is 'Backfills applicants only for the selected approved/active primary training owner.';
