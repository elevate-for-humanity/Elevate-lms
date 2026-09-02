-- Course publication is authorized by deterministic, versioned quality evidence.
-- Human sign-off remains required for learner practical competency evidence, not
-- for approving generated course content.

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
  v_total integer;
  v_bad_content integer;
  v_bad_generation integer;
  v_bad_assessment integer;
  v_lessons_updated integer;
  v_modules_updated integer;
begin
  perform 1 from public.courses where id = p_course_id for update;
  if not found then raise exception 'Course not found: %', p_course_id; end if;

  if not exists (
    select 1 from public.course_automated_approvals
    where course_id = p_course_id and decision = 'approved'
  ) then
    raise exception 'PUBLISH_BLOCKED: automated quality-gate evidence is missing';
  end if;

  select count(*) into v_total from public.course_lessons
  where course_id = p_course_id and coalesce(is_required, true) = true;
  if v_total = 0 then raise exception 'No required course lessons found for course %', p_course_id; end if;

  select count(*) into v_bad_content from public.course_lessons
  where course_id = p_course_id and coalesce(is_required, true) = true
    and content is null and coalesce(rendered_html, '') = '' and coalesce(video_url, '') = '';
  if v_bad_content > 0 then raise exception 'Publication blocked: % required lesson(s) have no instructional content', v_bad_content; end if;

  select count(*) into v_bad_generation from public.course_lessons
  where course_id = p_course_id and coalesce(is_required, true) = true
    and coalesce(generation_status, '') not in ('generated','complete','completed','verification_ready','certificate_ready','published');
  if v_bad_generation > 0 then raise exception 'Publication blocked: % required lesson(s) are not complete', v_bad_generation; end if;

  select count(*) into v_bad_assessment from public.course_lessons
  where course_id = p_course_id and lesson_type in ('checkpoint','quiz','exam','final_exam')
    and (quiz_questions is null or jsonb_typeof(quiz_questions) <> 'array' or jsonb_array_length(quiz_questions) = 0 or passing_score is null);
  if v_bad_assessment > 0 then raise exception 'Publication blocked: % assessment lesson(s) are incomplete', v_bad_assessment; end if;

  update public.course_lessons set is_published=true,status='published',approved=true,
    published_at=coalesce(published_at,now()),updated_at=now() where course_id=p_course_id;
  get diagnostics v_lessons_updated = row_count;
  update public.course_modules set is_published=true,is_draft=false,updated_at=now() where course_id=p_course_id;
  get diagnostics v_modules_updated = row_count;
  update public.courses set status='published',review_status='published',is_active=true,
    published_at=coalesce(published_at,now()),generation_status='published',generation_progress=100,
    total_lessons=v_total,updated_at=now() where id=p_course_id;

  return jsonb_build_object('lessons_published',v_lessons_updated,'modules_published',v_modules_updated,
    'curriculum_lessons_inserted',0,'curriculum_lessons_skipped',0,'automated_quality_gate','passed');
end;
$function$;
