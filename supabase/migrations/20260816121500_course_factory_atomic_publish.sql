-- Canonical Course Factory atomic persistence boundary.
-- All replace-mode course package writes execute inside one PostgreSQL function
-- invocation so any error rolls back the entire replacement.

create or replace function public.publish_course_package_atomic(
  p_program_id uuid,
  p_course_slug text,
  p_course_title text,
  p_mode text,
  p_modules jsonb
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_course_id uuid;
  v_module jsonb;
  v_lesson jsonb;
  v_module_id uuid;
  v_module_count integer := 0;
  v_lesson_count integer := 0;
  v_skipped_count integer := 0;
begin
  if p_mode not in ('replace', 'missing-only') then
    raise exception 'Unsupported course publish mode: %', p_mode;
  end if;

  if p_program_id is null then
    raise exception 'program_id is required';
  end if;

  if nullif(trim(p_course_slug), '') is null then
    raise exception 'course_slug is required';
  end if;

  if jsonb_typeof(coalesce(p_modules, '[]'::jsonb)) <> 'array' then
    raise exception 'modules payload must be a JSON array';
  end if;

  select id
    into v_course_id
    from public.courses
   where slug = p_course_slug
   for update;

  if v_course_id is null then
    insert into public.courses (slug, title, program_id, status, is_active)
    values (p_course_slug, p_course_title, p_program_id, 'draft'::course_status, false)
    returning id into v_course_id;
  else
    update public.courses
       set title = p_course_title,
           program_id = p_program_id,
           status = 'draft'::course_status,
           is_active = false,
           updated_at = now()
     where id = v_course_id;
  end if;

  if p_mode = 'replace' then
    delete from public.course_lessons where course_id = v_course_id;
    delete from public.course_modules where course_id = v_course_id;
  end if;

  for v_module in
    select value from jsonb_array_elements(coalesce(p_modules, '[]'::jsonb))
  loop
    v_module_id := null;

    if p_mode = 'missing-only' then
      select id
        into v_module_id
        from public.course_modules
       where course_id = v_course_id
         and slug = v_module->>'slug'
       order by id
       limit 1;
    end if;

    if v_module_id is null then
      insert into public.course_modules (
        course_id,
        slug,
        title,
        description,
        order_index,
        is_published
      ) values (
        v_course_id,
        v_module->>'slug',
        v_module->>'title',
        nullif(v_module->>'description', ''),
        coalesce((v_module->>'order_index')::integer, v_module_count + 1),
        false
      )
      returning id into v_module_id;
    else
      update public.course_modules
         set title = v_module->>'title',
             description = nullif(v_module->>'description', ''),
             order_index = coalesce((v_module->>'order_index')::integer, order_index),
             is_published = false,
             updated_at = now()
       where id = v_module_id;
    end if;

    v_module_count := v_module_count + 1;

    for v_lesson in
      select value from jsonb_array_elements(coalesce(v_module->'lessons', '[]'::jsonb))
    loop
      if p_mode = 'missing-only' and exists (
        select 1
          from public.course_lessons
         where course_id = v_course_id
           and slug = v_lesson->>'slug'
      ) then
        v_skipped_count := v_skipped_count + 1;
        continue;
      end if;

      insert into public.course_lessons (
        course_id,
        module_id,
        slug,
        title,
        lesson_type,
        order_index,
        objective,
        content,
        quiz_questions,
        passing_score,
        activities,
        status,
        is_published
      ) values (
        v_course_id,
        v_module_id,
        v_lesson->>'slug',
        v_lesson->>'title',
        coalesce(nullif(v_lesson->>'lesson_type', ''), 'lesson')::lesson_type,
        coalesce((v_lesson->>'order_index')::integer, v_lesson_count + 1),
        nullif(v_lesson->>'objective', ''),
        case
          when v_lesson ? 'content' then v_lesson->'content'
          else null
        end,
        case
          when v_lesson ? 'quiz_questions' then v_lesson->'quiz_questions'
          else null
        end,
        case
          when nullif(v_lesson->>'passing_score', '') is not null
            then (v_lesson->>'passing_score')::integer
          else null
        end,
        case
          when v_lesson ? 'activities' then v_lesson->'activities'
          else null
        end,
        'draft',
        false
      );

      v_lesson_count := v_lesson_count + 1;
    end loop;
  end loop;

  return jsonb_build_object(
    'success', true,
    'course_id', v_course_id,
    'module_count', v_module_count,
    'lesson_count', v_lesson_count,
    'skipped_count', v_skipped_count
  );
end;
$$;

comment on function public.publish_course_package_atomic(uuid, text, text, text, jsonb)
is 'Atomic canonical Course Factory persistence. Errors roll back the entire course package operation.';
