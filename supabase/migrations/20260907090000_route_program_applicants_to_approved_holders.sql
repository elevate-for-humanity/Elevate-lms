-- Route student applications to the primary active Program Holder for the
-- application's canonical program. Applications remain platform records; this
-- table is the holder-scoped review projection used by the Program Holder PWA.

create unique index if not exists uq_program_holder_students_holder_application
  on public.program_holder_students (program_holder_id, application_id)
  where application_id is not null;

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
    and lower(coalesce(ph.status, '')) in ('active', 'approved')
  order by coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
  limit 1;

  if v_holder_id is null then return new; end if;
  v_name := coalesce(nullif(new.full_name, ''), nullif(new.name, ''), trim(concat_ws(' ', new.first_name, new.last_name)));

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

drop trigger if exists trg_route_application_to_program_holder_v1 on public.applications;
create trigger trg_route_application_to_program_holder_v1
after insert or update of program_id, program_slug, pathway_slug, program_name, program_interest, status, user_id
on public.applications
for each row execute function public.route_application_to_program_holder_v1();

create or replace function public.sync_program_holder_assignment_applicants_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.status, 'active') = 'active' then
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
  end if;
  return new;
end;
$$;

revoke all on function public.sync_program_holder_assignment_applicants_v1() from public;
grant execute on function public.sync_program_holder_assignment_applicants_v1() to service_role;

drop trigger if exists trg_sync_program_holder_assignment_applicants_v1 on public.program_holder_programs;
create trigger trg_sync_program_holder_assignment_applicants_v1
after insert or update of program_holder_id, program_id, program_slug, status, is_primary
on public.program_holder_programs
for each row execute function public.sync_program_holder_assignment_applicants_v1();

comment on function public.route_application_to_program_holder_v1()
is 'Projects canonical student applications into the approved primary Program Holder dashboard for that program.';
