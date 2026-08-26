create or replace function public.sync_active_program_enrollment_courses()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if new.user_id is null or new.program_id is null then
    return new;
  end if;

  if coalesce(new.enrollment_state, new.status) <> 'active' then
    return new;
  end if;

  insert into public.course_enrollments (
    student_id, course_id, status, progress, created_at, updated_at
  )
  select new.user_id, c.id, 'active', '0', now(), now()
  from public.program_courses pc
  join public.courses c on c.id = pc.course_id
  where pc.program_id = new.program_id
    and c.is_active = true
    and c.status = 'published'
    and not exists (
      select 1 from public.course_enrollments ce
      where ce.student_id = new.user_id and ce.course_id = c.id
    );

  return new;
end;
$function$;

create or replace function public.sync_published_course_program_enrollments()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if new.program_id is null
     or new.is_active is distinct from true
     or new.status is distinct from 'published' then
    return new;
  end if;

  insert into public.program_courses (program_id, course_id, is_required, order_index)
  values (new.program_id, new.id, true, 0)
  on conflict (program_id, course_id) do nothing;

  insert into public.course_enrollments (
    student_id, course_id, status, progress, created_at, updated_at
  )
  select pe.user_id, new.id, 'active', '0', now(), now()
  from public.program_enrollments pe
  where pe.program_id = new.program_id
    and pe.user_id is not null
    and coalesce(pe.enrollment_state, pe.status) = 'active'
    and not exists (
      select 1 from public.course_enrollments ce
      where ce.student_id = pe.user_id and ce.course_id = new.id
    );

  return new;
end;
$function$;

drop trigger if exists trg_sync_published_course_program_enrollments on public.courses;
create trigger trg_sync_published_course_program_enrollments
after insert or update of program_id, status, is_active on public.courses
for each row execute function public.sync_published_course_program_enrollments();