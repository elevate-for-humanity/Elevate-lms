create or replace function public.replace_lesson_assessment_questions(
  p_lesson_id uuid,
  p_questions jsonb,
  p_quiz_questions jsonb,
  p_passing_score integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question_count integer;
begin
  if p_lesson_id is null then
    raise exception 'lesson_id is required';
  end if;
  if p_passing_score is null or p_passing_score < 1 or p_passing_score > 100 then
    raise exception 'passing_score must be between 1 and 100';
  end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_typeof(p_quiz_questions) <> 'array' then
    raise exception 'assessment questions must be JSON arrays';
  end if;

  v_question_count := jsonb_array_length(p_questions);
  if v_question_count < 1 or v_question_count > 100 then
    raise exception 'assessment must contain between 1 and 100 questions';
  end if;
  if jsonb_array_length(p_quiz_questions) <> v_question_count then
    raise exception 'canonical questions and learner projection must have the same length';
  end if;

  perform 1
  from public.course_lessons
  where id = p_lesson_id
  for update;
  if not found then
    raise exception 'assessment lesson not found';
  end if;

  delete from public.assessment_questions
  where lesson_id = p_lesson_id;

  insert into public.assessment_questions (
    lesson_id,
    question_type,
    prompt,
    choices,
    correct_answer,
    explanation,
    competency_key,
    difficulty,
    domain_key,
    sort_order
  )
  select
    p_lesson_id,
    question->>'question_type',
    question->>'prompt',
    question->'choices',
    question->'correct_answer',
    nullif(question->>'explanation', ''),
    nullif(question->>'competency_key', ''),
    coalesce(nullif(question->>'difficulty', ''), 'medium'),
    nullif(question->>'domain_key', ''),
    (question->>'sort_order')::integer
  from jsonb_array_elements(p_questions) as question;

  update public.course_lessons
  set
    quiz_questions = p_quiz_questions,
    passing_score = p_passing_score,
    updated_at = now()
  where id = p_lesson_id;

  return v_question_count;
end;
$$;

revoke all on function public.replace_lesson_assessment_questions(uuid,jsonb,jsonb,integer)
from public, anon, authenticated;
grant execute on function public.replace_lesson_assessment_questions(uuid,jsonb,jsonb,integer)
to service_role;
