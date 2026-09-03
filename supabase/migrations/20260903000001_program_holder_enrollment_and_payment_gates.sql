-- Only actual enrolled learners are assigned to a Program Holder.
-- Applicants remain visible to platform admins and in the separate applicant workflow.
create or replace function public.assign_program_holder_to_enrollment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.program_id is null then
    return new;
  end if;

  if lower(coalesce(new.status, '')) not in ('active', 'enrolled', 'completed', 'graduated') then
    new.program_holder_id := null;
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
before insert or update of program_id, program_holder_id, status
on public.program_enrollments
for each row
execute function public.assign_program_holder_to_enrollment();

revoke all on function public.assign_program_holder_to_enrollment() from public;
