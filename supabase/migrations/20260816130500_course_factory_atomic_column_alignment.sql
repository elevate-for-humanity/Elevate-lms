-- Correct the atomic Course Factory writer to the live course_lessons schema.
-- Learning intent is stored in scenario_prompt + learning_objectives; there is
-- no standalone objective column in the canonical table.

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
  if nullif(trim(p_course_slug), '') is null then
    raise exception 'course_slug is required';
  end if;
  if jsonb_typeof(coalesce(p_modules, '[]'::jsonb)) <> 'array' then
    raise exception 'modules payload must be a JSON array';
  end if;

  select id into v_course_id
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
        program_id = coalesce(p_program_id, program_id),
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
      select id into v_module_id
      from public.course_modules
      where course_id = v_course_id and slug = v_module->>'slug'
      order by id limit 1;
    end if;

    if v_module_id is null then
      insert into public.course_modules (
        course_id, slug, title, description, order_index, is_published,
        domain_key, target_hours, is_required, is_draft
      ) values (
        v_course_id,
        v_module->>'slug',
        v_module->>'title',
        nullif(v_module->>'description', ''),
        coalesce((v_module->>'order_index')::integer, v_module_count + 1),
        false,
        nullif(v_module->>'domain_key', ''),
        case when nullif(v_module->>'target_hours','') is not null then (v_module->>'target_hours')::numeric else null end,
        coalesce((v_module->>'is_required')::boolean, true),
        true
      ) returning id into v_module_id;
    else
      update public.course_modules
      set title = v_module->>'title',
          description = nullif(v_module->>'description', ''),
          order_index = coalesce((v_module->>'order_index')::integer, order_index),
          domain_key = nullif(v_module->>'domain_key', ''),
          target_hours = case when nullif(v_module->>'target_hours','') is not null then (v_module->>'target_hours')::numeric else target_hours end,
          is_required = coalesce((v_module->>'is_required')::boolean, is_required),
          is_published = false,
          is_draft = true,
          updated_at = now()
      where id = v_module_id;
    end if;

    v_module_count := v_module_count + 1;

    for v_lesson in
      select value from jsonb_array_elements(coalesce(v_module->'lessons', '[]'::jsonb))
    loop
      if p_mode = 'missing-only' and exists (
        select 1 from public.course_lessons
        where course_id = v_course_id and slug = v_lesson->>'slug'
      ) then
        v_skipped_count := v_skipped_count + 1;
        continue;
      end if;

      insert into public.course_lessons (
        course_id, module_id, slug, title, lesson_type, order_index,
        scenario_prompt, content, rendered_html, quiz_questions, passing_score,
        activities, duration_minutes, video_url, video_config,
        learning_objectives, competency_checks, instructor_notes,
        practical_required, required_artifacts, unlock_rule, partner_exam_code,
        domain_key, hour_category, evidence_type, delivery_method,
        requires_instructor_signoff, instructor_requirement,
        minimum_seat_time_minutes, fieldwork_eligible,
        is_required, ai_generated, approved, compliance_profile_key,
        status, is_published
      ) values (
        v_course_id,
        v_module_id,
        v_lesson->>'slug',
        v_lesson->>'title',
        coalesce(nullif(v_lesson->>'lesson_type',''),'lesson')::lesson_type,
        coalesce((v_lesson->>'order_index')::integer, v_lesson_count + 1),
        nullif(v_lesson->>'objective',''),
        case when v_lesson ? 'content' then v_lesson->'content' else null end,
        nullif(v_lesson->>'rendered_html',''),
        case when v_lesson ? 'quiz_questions' then v_lesson->'quiz_questions' else null end,
        case when nullif(v_lesson->>'passing_score','') is not null then (v_lesson->>'passing_score')::integer else null end,
        case when v_lesson ? 'activities' then v_lesson->'activities' else null end,
        case when nullif(v_lesson->>'duration_minutes','') is not null then (v_lesson->>'duration_minutes')::integer else null end,
        nullif(v_lesson->>'video_url',''),
        case when v_lesson ? 'video_config' then v_lesson->'video_config' else null end,
        case when v_lesson ? 'learning_objectives' then v_lesson->'learning_objectives' else null end,
        case when v_lesson ? 'competency_checks' then v_lesson->'competency_checks' else null end,
        nullif(v_lesson->>'instructor_notes',''),
        coalesce((v_lesson->>'practical_required')::boolean,false),
        case when v_lesson ? 'required_artifacts' then array(select jsonb_array_elements_text(v_lesson->'required_artifacts')) else '{}'::text[] end,
        case when v_lesson ? 'unlock_rule' then v_lesson->'unlock_rule' else null end,
        nullif(v_lesson->>'partner_exam_code',''),
        nullif(v_lesson->>'domain_key',''),
        nullif(v_lesson->>'hour_category',''),
        nullif(v_lesson->>'evidence_type',''),
        nullif(v_lesson->>'delivery_method',''),
        coalesce((v_lesson->>'requires_instructor_signoff')::boolean,false),
        case when v_lesson ? 'instructor_requirement' then v_lesson->'instructor_requirement' else null end,
        case when nullif(v_lesson->>'minimum_seat_time_minutes','') is not null then (v_lesson->>'minimum_seat_time_minutes')::integer else null end,
        coalesce((v_lesson->>'fieldwork_eligible')::boolean,false),
        coalesce((v_lesson->>'is_required')::boolean,true),
        coalesce((v_lesson->>'ai_generated')::boolean,false),
        coalesce((v_lesson->>'approved')::boolean,false),
        nullif(v_lesson->>'compliance_profile_key',''),
        'draft', false
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
is 'Atomic Course Factory persistence aligned to live course_modules/course_lessons columns.';
