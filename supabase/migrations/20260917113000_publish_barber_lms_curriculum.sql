-- Publish the complete canonical barber curriculum and restore LMS access.
-- The content guard prevents an incomplete curriculum from being exposed.

begin;

update public.courses
set status = 'published',
    is_active = true,
    generation_status = 'published',
    generation_progress = 100,
    published_at = coalesce(published_at, now()),
    updated_at = now()
where id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  and exists (
    select 1
    from public.course_lessons cl
    where cl.course_id = courses.id
    having count(*) = 50
       and count(*) filter (
         where cl.content is not null
            or nullif(trim(cl.rendered_html), '') is not null
       ) = 50
       and count(*) filter (where nullif(trim(cl.title), '') is not null) = 50
  );

update public.course_modules
set is_published = true,
    is_draft = false,
    updated_at = now()
where course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  and exists (
    select 1
    from public.courses c
    where c.id = course_modules.course_id
      and c.status = 'published'
      and c.is_active = true
  );

update public.course_lessons
set status = 'published',
    is_published = true,
    approved = true,
    generation_status = 'published',
    published_at = coalesce(published_at, now()),
    updated_at = now()
where course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  and nullif(trim(title), '') is not null
  and (content is not null or nullif(trim(rendered_html), '') is not null)
  and exists (
    select 1
    from public.courses c
    where c.id = course_lessons.course_id
      and c.status = 'published'
      and c.is_active = true
  );

update public.program_enrollments
set lms_enrolled = true,
    updated_at = now()
where course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  and coalesce(enrollment_state, status) = 'active'
  and exists (
    select 1
    from public.course_enrollments ce
    where ce.student_id = coalesce(program_enrollments.user_id, program_enrollments.student_id)
      and ce.course_id = program_enrollments.course_id
      and ce.status in ('active', 'enrolled', 'in_progress')
  );

commit;
