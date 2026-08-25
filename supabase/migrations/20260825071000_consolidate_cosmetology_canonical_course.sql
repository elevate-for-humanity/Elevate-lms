-- Consolidate the obsolete empty Cosmetology course into the canonical 2,000-hour course.
do $$
declare
  v_old uuid;
  v_canonical uuid;
  v_lesson_count bigint;
begin
  select id into v_old
  from public.courses
  where slug = 'cosmetology-apprenticeship'
    and title = 'Cosmetology Apprenticeship'
  limit 1;

  select id into v_canonical
  from public.courses
  where slug in ('cosmetology-apprenticeship-course', 'cosmetology-apprenticeship')
    and title = 'Cosmetology Apprenticeship - Complete Course'
  order by case when slug = 'cosmetology-apprenticeship-course' then 0 else 1 end
  limit 1;

  if v_canonical is null then
    raise exception 'Canonical complete Cosmetology course was not found';
  end if;

  if v_old is null or v_old = v_canonical then
    return;
  end if;

  select count(*) into v_lesson_count
  from public.course_lessons where course_id = v_old;
  v_lesson_count := v_lesson_count + (
    select count(*) from public.lessons where course_id_uuid = v_old
  );
  if v_lesson_count <> 0 then
    raise exception 'Obsolete Cosmetology course unexpectedly contains % lessons; aborting', v_lesson_count;
  end if;

  update public.program_enrollments
  set course_id = v_canonical, updated_at = now()
  where course_id = v_old;

  update public.program_course_map
  set course_id = v_canonical, updated_at = now()
  where course_id = v_old;

  delete from public.courses where id = v_old;

  update public.courses
  set slug = 'cosmetology-apprenticeship', updated_at = now()
  where id = v_canonical;
end $$;
