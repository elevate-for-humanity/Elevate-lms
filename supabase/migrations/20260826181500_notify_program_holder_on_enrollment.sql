-- Notify the assigned Program Holder after the canonical enrollment trigger
-- has populated program_enrollments.program_holder_id.
--
-- This intentionally does not replace rpc_enroll_student. The RPC owns
-- idempotency, course enrollment, learner notification, delivery logging and
-- audit behavior. Keeping holder notification in a row trigger also covers
-- every non-RPC enrollment path.

create or replace function public.notify_program_holder_on_enrollment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_holder_user_id uuid;
  v_student_name text;
  v_program_name text;
begin
  if new.program_holder_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.program_holder_id is not distinct from old.program_holder_id then
    return new;
  end if;

  select ph.user_id
    into v_holder_user_id
  from public.program_holders ph
  where ph.id = new.program_holder_id
    and coalesce(ph.status, 'active') = 'active';

  if v_holder_user_id is null then
    return new;
  end if;

  select coalesce(p.full_name, p.email, 'A learner')
    into v_student_name
  from public.profiles p
  where p.id = coalesce(new.user_id, new.student_id);

  select coalesce(p.name, p.title, 'your program')
    into v_program_name
  from public.programs p
  where p.id = new.program_id;

  insert into public.notifications (
    user_id,
    tenant_id,
    type,
    title,
    message,
    action_url,
    action_label,
    metadata,
    idempotency_key,
    read,
    created_at
  ) values (
    v_holder_user_id,
    new.tenant_id,
    'system',
    'New Student Assigned',
    format(
      '%s has joined your program: %s',
      coalesce(v_student_name, 'A learner'),
      coalesce(v_program_name, 'your program')
    ),
    '/program-holder/students',
    'View Students',
    jsonb_build_object(
      'enrollment_id', new.id,
      'student_id', coalesce(new.user_id, new.student_id),
      'program_id', new.program_id,
      'program_holder_id', new.program_holder_id
    ),
    'program-holder-enrollment:' || new.id::text || ':' || new.program_holder_id::text,
    false,
    now()
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

drop trigger if exists program_enrollments_notify_program_holder
  on public.program_enrollments;
create trigger program_enrollments_notify_program_holder
after insert or update of program_holder_id
on public.program_enrollments
for each row
execute function public.notify_program_holder_on_enrollment();

revoke all on function public.notify_program_holder_on_enrollment() from public;
