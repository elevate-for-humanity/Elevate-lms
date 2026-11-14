-- Harden the staging publication contract so publication cannot manufacture its
-- own human-review approval. Course Builder procurement checks remain the
-- application gate; this function provides a database-level backstop.

create or replace function public.publish_course_from_staging(
  p_course_id uuid,
  p_program_id uuid default null::uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_course_status text;
  v_review_status text;
  v_total integer;
  v_bad_content integer;
  v_bad_generation integer;
  v_bad_assessment integer;
  v_unapproved integer;
  v_lessons_updated integer;
  v_modules_updated integer;
begin
  select status::text, review_status::text
    into v_course_status, v_review_status
  from public.courses
  where id = p_course_id
  for update;

  if not found then
    raise exception 'Course not found: %', p_course_id;
  end if;

  if v_course_status <> 'draft' then
    raise exception 'Course status=% — only draft courses can be published', v_course_status;
  end if;

  -- Publication is not review. An authorized reviewer must approve the course
  -- before this function can publish it.
  if coalesce(v_review_status, '') <> 'approved' then
    raise exception 'PUBLISH_BLOCKED: course has not completed human review/approval';
  end if;

  select count(*) into v_total
  from public.course_lessons
  where course_id = p_course_id
    and coalesce(is_required, true) = true;

  if v_total = 0 then
    raise exception 'No required course lessons found for course %', p_course_id;
  end if;

  select count(*) into v_unapproved
  from public.course_lessons
  where course_id = p_course_id
    and coalesce(is_required, true) = true
    and coalesce(approved, false) = false;

  if v_unapproved > 0 then
    raise exception 'PUBLISH_BLOCKED: % required lesson(s) have not completed human review/approval', v_unapproved;
  end if;

  select count(*) into v_bad_content
  from public.course_lessons
  where course_id = p_course_id
    and coalesce(is_required, true) = true
    and (
      content is null
      or length(regexp_replace(coalesce(content->>'html', ''), '<[^>]+>', '', 'g')) < 200
    );

  if v_bad_content > 0 then
    raise exception 'Publication blocked: % required lesson(s) do not have complete instructional content', v_bad_content;
  end if;

  select count(*) into v_bad_generation
  from public.course_lessons
  where course_id = p_course_id
    and coalesce(is_required, true) = true
    and coalesce(generation_status, '') not in ('generated', 'complete', 'completed');

  if v_bad_generation > 0 then
    raise exception 'Publication blocked: % required lesson(s) are not in a completed generation state', v_bad_generation;
  end if;

  select count(*) into v_bad_assessment
  from public.course_lessons
  where course_id = p_course_id
    and lesson_type in ('checkpoint', 'quiz', 'exam')
    and (
      quiz_questions is null
      or jsonb_typeof(quiz_questions) <> 'array'
      or jsonb_array_length(quiz_questions) < case when lesson_type = 'exam' then 25 else 5 end
      or passing_score is null
    );

  if v_bad_assessment > 0 then
    raise exception 'Publication blocked: % assessment lesson(s) are incomplete', v_bad_assessment;
  end if;

  update public.course_lessons
  set is_published = true,
      status = 'published',
      published_at = coalesce(published_at, now()),
      updated_at = now()
  where course_id = p_course_id;
  get diagnostics v_lessons_updated = row_count;

  update public.course_modules
  set is_published = true,
      is_draft = false,
      updated_at = now()
  where course_id = p_course_id;
  get diagnostics v_modules_updated = row_count;

  update public.courses
  set status = 'published',
      is_active = true,
      published_at = coalesce(published_at, now()),
      generation_status = 'published',
      generation_progress = 100,
      total_lessons = v_total,
      updated_at = now()
  where id = p_course_id;

  insert into public.course_audit_log(course_id, actor_id, action, metadata)
  values (
    p_course_id,
    auth.uid(),
    'published',
    jsonb_build_object(
      'lessons_published', v_lessons_updated,
      'modules_published', v_modules_updated,
      'completeness_gate', 'passed',
      'human_review_gate', 'passed'
    )
  );

  return jsonb_build_object(
    'lessons_published', v_lessons_updated,
    'modules_published', v_modules_updated,
    'curriculum_lessons_inserted', 0,
    'curriculum_lessons_skipped', 0,
    'completeness_gate', 'passed',
    'human_review_gate', 'passed'
  );
end;
$function$;
