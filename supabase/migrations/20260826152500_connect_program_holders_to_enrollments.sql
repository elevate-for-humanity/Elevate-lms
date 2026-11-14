-- Keep every program enrollment connected to the canonical Program Holder assignment.
-- This trigger covers rpc_enroll_student and every other enrollment path.

create or replace function public.assign_program_holder_to_enrollment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.program_id is null then
    return new;
  end if;

  if new.program_holder_id is null
     or (tg_op = 'UPDATE' and new.program_id is distinct from old.program_id) then
    select php.program_holder_id
      into new.program_holder_id
    from public.program_holder_programs php
    join public.program_holders ph on ph.id = php.program_holder_id
    where php.program_id = new.program_id
      and coalesce(php.status, 'active') = 'active'
      and coalesce(ph.status, 'active') = 'active'
    order by coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
    limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists program_enrollments_assign_program_holder on public.program_enrollments;
create trigger program_enrollments_assign_program_holder
before insert or update of program_id, program_holder_id
on public.program_enrollments
for each row
execute function public.assign_program_holder_to_enrollment();

update public.program_enrollments pe
set program_holder_id = (
      select php.program_holder_id
      from public.program_holder_programs php
      join public.program_holders ph on ph.id = php.program_holder_id
      where php.program_id = pe.program_id
        and coalesce(php.status, 'active') = 'active'
        and coalesce(ph.status, 'active') = 'active'
      order by coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
      limit 1
    ),
    updated_at = now()
where pe.program_holder_id is null
  and exists (
    select 1
    from public.program_holder_programs php
    join public.program_holders ph on ph.id = php.program_holder_id
    where php.program_id = pe.program_id
      and coalesce(php.status, 'active') = 'active'
      and coalesce(ph.status, 'active') = 'active'
  );

create or replace function public.sync_program_holder_assignment_enrollments()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(new.status, 'active') = 'active' then
    update public.program_enrollments
    set program_holder_id = new.program_holder_id,
        updated_at = now()
    where program_id = new.program_id
      and (program_holder_id is null or coalesce(new.is_primary, false));
  end if;
  return new;
end;
$$;

drop trigger if exists program_holder_programs_sync_enrollments on public.program_holder_programs;
create trigger program_holder_programs_sync_enrollments
after insert or update of program_holder_id, program_id, status, is_primary
on public.program_holder_programs
for each row
execute function public.sync_program_holder_assignment_enrollments();

revoke all on function public.assign_program_holder_to_enrollment() from public;
revoke all on function public.sync_program_holder_assignment_enrollments() from public;