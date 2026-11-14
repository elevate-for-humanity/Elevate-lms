-- Close pre-existing Course Builder RLS gaps on canonical curriculum mapping
-- tables. Learners may read mappings only through courses they can access;
-- writes remain restricted to trusted staff roles.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'course_accreditation_metadata',
    'course_objectives',
    'lesson_competency_map',
    'lesson_objectives',
    'module_competencies',
    'module_objectives'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_staff_manage', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))',
      table_name || '_staff_manage', table_name
    );
  end loop;
end $$;

drop policy if exists course_accreditation_metadata_learner_read on public.course_accreditation_metadata;
create policy course_accreditation_metadata_learner_read
on public.course_accreditation_metadata for select to authenticated
using (
  exists (
    select 1 from public.course_lessons l
    where l.course_id = course_accreditation_metadata.course_id
      and private.can_access_course_lesson(course_accreditation_metadata.course_id, l.id)
  )
);

drop policy if exists course_objectives_learner_read on public.course_objectives;
create policy course_objectives_learner_read
on public.course_objectives for select to authenticated
using (
  exists (
    select 1 from public.course_lessons l
    where l.course_id = course_objectives.course_id
      and private.can_access_course_lesson(course_objectives.course_id, l.id)
  )
);

drop policy if exists lesson_competency_map_learner_read on public.lesson_competency_map;
create policy lesson_competency_map_learner_read
on public.lesson_competency_map for select to authenticated
using (
  exists (
    select 1 from public.course_lessons l
    where l.id = lesson_competency_map.lesson_id
      and private.can_access_course_lesson(l.course_id, l.id)
  )
);

drop policy if exists lesson_objectives_learner_read on public.lesson_objectives;
create policy lesson_objectives_learner_read
on public.lesson_objectives for select to authenticated
using (
  exists (
    select 1 from public.course_lessons l
    where l.id = lesson_objectives.lesson_id
      and private.can_access_course_lesson(l.course_id, l.id)
  )
);

drop policy if exists module_competencies_learner_read on public.module_competencies;
create policy module_competencies_learner_read
on public.module_competencies for select to authenticated
using (
  exists (
    select 1 from public.course_modules m
    join public.course_lessons l on l.module_id = m.id and l.course_id = m.course_id
    where m.id = module_competencies.module_id
      and private.can_access_course_lesson(m.course_id, l.id)
  )
);

drop policy if exists module_objectives_learner_read on public.module_objectives;
create policy module_objectives_learner_read
on public.module_objectives for select to authenticated
using (
  exists (
    select 1 from public.course_modules m
    join public.course_lessons l on l.module_id = m.id and l.course_id = m.course_id
    where m.id = module_objectives.module_id
      and private.can_access_course_lesson(m.course_id, l.id)
  )
);
