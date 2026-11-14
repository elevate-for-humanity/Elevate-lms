-- Atomically upgrades an existing authored course into the universal
-- interactive/narrated lesson contract. Publication, human approval, learner
-- progress, and existing video URLs are intentionally preserved.

create or replace function public.apply_authored_course_experience_upgrade(
  p_course_id uuid,
  p_lessons jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_expected integer;
  v_updated integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required';
  end if;
  if p_course_id is null or jsonb_typeof(p_lessons) is distinct from 'array' then
    raise exception 'course id and lesson array are required';
  end if;

  -- Serialize upgrades with publish/repair work for this exact course. The
  -- transaction stays short because all content compilation happens before
  -- this RPC is called.
  perform 1 from public.courses where id = p_course_id for update;
  if not found then raise exception 'course not found'; end if;

  v_expected := jsonb_array_length(p_lessons);
  if v_expected = 0 then raise exception 'lesson array cannot be empty'; end if;
  if (select count(*) from public.course_lessons where course_id = p_course_id) <> v_expected then
    raise exception 'atomic upgrade lesson count does not match persisted course';
  end if;

  for v_item in select value from jsonb_array_elements(p_lessons)
  loop
    update public.course_lessons
    set content = v_item->'content',
        content_json = v_item->'content_json',
        rendered_html = v_item->>'rendered_html',
        learning_objectives = v_item->'learning_objectives',
        quiz_questions = v_item->'quiz_questions',
        key_terms = v_item->'key_terms',
        activities = v_item->'activities',
        resources = v_item->'resources',
        video_config = v_item->'video_config',
        script_text = v_item->>'script_text',
        script = v_item->>'script',
        bullet_points = v_item->'bullet_points',
        scene_data = v_item->'scene_data',
        generation_status = case when approved then 'approved' else 'generated' end,
        last_generated_at = now(),
        updated_at = now()
    where id = (v_item->>'id')::uuid
      and course_id = p_course_id;
    if not found then raise exception 'lesson % does not belong to course', v_item->>'id'; end if;
    v_updated := v_updated + 1;
  end loop;

  update public.courses
  set generation_status = case when status::text = 'published' then 'published' else 'completed' end,
      generation_progress = 100,
      total_lessons = v_updated,
      updated_at = now()
  where id = p_course_id;

  insert into public.course_audit_log(course_id, actor_id, action, metadata)
  values (
    p_course_id,
    auth.uid(),
    'updated',
    jsonb_build_object(
      'operation', 'authored_course_experience_upgrade',
      'lessons', v_updated,
      'contract', 'universal-interactive-v1'
    )
  );

  return jsonb_build_object('success', true, 'course_id', p_course_id, 'lessons_updated', v_updated);
end;
$$;

revoke all on function public.apply_authored_course_experience_upgrade(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_authored_course_experience_upgrade(uuid, jsonb)
  to service_role;
