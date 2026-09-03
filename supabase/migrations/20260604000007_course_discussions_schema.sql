-- Add course_id and user_id to course_discussions if missing.
-- The discussions page already uses these columns in insert/select;
-- this migration ensures they exist in the live schema.

alter table public.course_discussions
  add column if not exists course_id uuid references public.training_courses(id) on delete cascade,
  add column if not exists user_id   uuid references auth.users(id) on delete cascade;

-- Index for fast per-course lookups
create index if not exists idx_course_discussions_course_id
  on public.course_discussions(course_id);

create index if not exists idx_course_discussions_user_id
  on public.course_discussions(user_id);
