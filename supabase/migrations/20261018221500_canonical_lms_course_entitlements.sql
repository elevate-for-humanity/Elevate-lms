-- Admission and LMS playback use lms_courses, which includes both course sources.
-- Keep one database authority for course access; preserve existing progress,
-- revocations, financial records, and independently reviewed eligibility.
create or replace function public.sync_active_program_enrollment_courses()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is null or new.program_id is null
     or coalesce(new.enrollment_state, new.status) <> 'active' then
    return new;
  end if;
  insert into public.course_enrollments (student_id, course_id, status, progress, created_at, updated_at)
  select distinct new.user_id, c.id, 'active', '0', now(), now()
  from public.lms_courses c
  where c.is_active is true and c.status = 'published'
    and (c.program_id = new.program_id or exists (
      select 1 from public.program_courses pc
      where pc.program_id = new.program_id and pc.course_id = c.id
    ))
  on conflict (student_id, course_id) do nothing;
  return new;
end;
$$;

create or replace function public.sync_published_course_program_enrollments()
returns trigger language plpgsql security definer set search_path = '' as $$
declare canonical_course record;
begin
  -- The canonical view also excludes shadowed legacy training rows. A source
  -- row must actually be available in that catalog before granting access.
  select c.id, c.program_id into canonical_course
  from public.lms_courses c
  where c.id = new.id and c.is_active is true and c.status = 'published';
  if not found then return new; end if;

  if canonical_course.program_id is not null then
    insert into public.program_courses (program_id, course_id, is_required, order_index)
    values (canonical_course.program_id, canonical_course.id, true, 0)
    on conflict (program_id, course_id) do nothing;
  end if;

  insert into public.course_enrollments (student_id, course_id, status, progress, created_at, updated_at)
  select distinct pe.user_id, canonical_course.id, 'active', '0', now(), now()
  from public.program_enrollments pe
  where pe.user_id is not null and pe.program_id is not null
    and coalesce(pe.enrollment_state, pe.status) = 'active'
    and (pe.program_id = canonical_course.program_id or exists (
      select 1 from public.program_courses pc
      where pc.program_id = pe.program_id and pc.course_id = canonical_course.id
    ))
  on conflict (student_id, course_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_sync_published_course_program_enrollments on public.courses;
create trigger trg_sync_published_course_program_enrollments
after insert or update of program_id, status, is_active on public.courses
for each row execute function public.sync_published_course_program_enrollments();

drop trigger if exists trg_sync_published_course_program_enrollments on public.training_courses;
create trigger trg_sync_published_course_program_enrollments
after insert or update of program_id, status, is_active, is_published on public.training_courses
for each row execute function public.sync_published_course_program_enrollments();

revoke execute on function public.sync_active_program_enrollment_courses() from public, anon, authenticated;
revoke execute on function public.sync_published_course_program_enrollments() from public, anon, authenticated;
grant execute on function public.sync_active_program_enrollment_courses() to service_role;
grant execute on function public.sync_published_course_program_enrollments() to service_role;

-- Reconcile only access already authorized by an active program enrollment.
-- ON CONFLICT protects progress and explicit revocations, including on replay.
insert into public.course_enrollments (student_id, course_id, status, progress, created_at, updated_at)
select distinct pe.user_id, c.id, 'active', '0', now(), now()
from public.program_enrollments pe
join public.lms_courses c on (
  c.program_id = pe.program_id or exists (
    select 1 from public.program_courses pc
    where pc.program_id = pe.program_id and pc.course_id = c.id
  )
)
where pe.user_id is not null and pe.program_id is not null
  and coalesce(pe.enrollment_state, pe.status) = 'active'
  and c.is_active is true and c.status = 'published'
on conflict (student_id, course_id) do nothing;
