-- Cover foreign-key joins/deletes identified by the production advisor.
create index if not exists course_practical_submissions_course_idx
  on public.course_practical_submissions (course_id);
create index if not exists course_practical_submissions_lesson_idx
  on public.course_practical_submissions (lesson_id);
create index if not exists learning_action_events_course_idx
  on public.learning_action_events (course_id);
create index if not exists learning_action_events_lesson_idx
  on public.learning_action_events (lesson_id);
