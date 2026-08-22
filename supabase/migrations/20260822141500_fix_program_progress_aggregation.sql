-- program_enrollments.progress_percent is PROGRAM progress, not the percentage
-- of whichever course happened to receive the latest lesson_progress write.
-- Recompute it across every required course linked through program_courses.

create or replace function public.sync_enrollment_progress_on_lesson_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment record;
  v_total int;
  v_done int;
  v_pct numeric(5,2);
begin
  if new.course_id is null or new.user_id is null then
    return new;
  end if;

  -- Recalculate on either completion or uncompletion. Ignore updates that do
  -- not change the completed flag.
  if tg_op = 'UPDATE' and new.completed is not distinct from old.completed then
    return new;
  end if;

  for v_enrollment in
    select distinct pe.id, pe.program_id, pe.course_id
    from public.program_enrollments pe
    where (pe.user_id = new.user_id or pe.student_id = new.user_id)
      and (
        pe.course_id = new.course_id
        or exists (
          select 1
          from public.program_courses pc
          where pc.program_id = pe.program_id
            and pc.course_id = new.course_id
            and coalesce(pc.is_required, true) = true
        )
        or exists (
          select 1
          from public.courses c
          where c.id = new.course_id
            and c.program_id = pe.program_id
        )
      )
  loop
    with required_courses as (
      select pc.course_id
      from public.program_courses pc
      where pc.program_id = v_enrollment.program_id
        and coalesce(pc.is_required, true) = true
      union
      select coalesce(v_enrollment.course_id, new.course_id)
      where not exists (
        select 1
        from public.program_courses pc2
        where pc2.program_id = v_enrollment.program_id
          and coalesce(pc2.is_required, true) = true
      )
    ), required_lessons as (
      select cl.id
      from public.course_lessons cl
      join required_courses rc on rc.course_id = cl.course_id
      where cl.is_required = true
        and cl.is_published = true
    )
    select count(*) into v_total from required_lessons;

    with required_courses as (
      select pc.course_id
      from public.program_courses pc
      where pc.program_id = v_enrollment.program_id
        and coalesce(pc.is_required, true) = true
      union
      select coalesce(v_enrollment.course_id, new.course_id)
      where not exists (
        select 1
        from public.program_courses pc2
        where pc2.program_id = v_enrollment.program_id
          and coalesce(pc2.is_required, true) = true
      )
    ), required_lessons as (
      select cl.id
      from public.course_lessons cl
      join required_courses rc on rc.course_id = cl.course_id
      where cl.is_required = true
        and cl.is_published = true
    )
    select count(distinct lp.lesson_id)
      into v_done
    from public.lesson_progress lp
    join required_lessons rl on rl.id = lp.lesson_id
    where lp.user_id = new.user_id
      and lp.completed = true;

    v_pct := case
      when v_total > 0 then round((v_done::numeric / v_total) * 100, 2)
      else 0
    end;

    update public.program_enrollments
    set progress_percent = v_pct,
        updated_at = now()
    where id = v_enrollment.id;
  end loop;

  return new;
end;
$$;

-- Existing trigger name remains canonical. The function now handles both
-- completion and uncompletion transitions correctly.
drop trigger if exists trg_sync_enrollment_progress on public.lesson_progress;
create trigger trg_sync_enrollment_progress
  after insert or update of completed
  on public.lesson_progress
  for each row
  execute function public.sync_enrollment_progress_on_lesson_complete();
