-- lesson_responses
-- Stores student free-text responses typed inline during lessons
-- (LessonInlineInput component). One row per user × lesson × field_key.
-- field_key is a stable slug set by the lesson author (e.g. 'reading-reflection').

create table if not exists public.lesson_responses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  lesson_id   uuid not null,
  course_id   uuid not null,
  field_key   text not null,
  response_text text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()

  -- upsert conflict target used by LessonInlineInput
  , constraint lesson_responses_user_lesson_field_key unique (user_id, lesson_id, field_key)
);

-- Learners can only read/write their own responses
alter table public.lesson_responses enable row level security;

drop policy if exists "lesson_responses: learner read own" on public.lesson_responses;
create policy "lesson_responses: learner read own" on public.lesson_responses for select
  using (auth.uid() = user_id);

drop policy if exists "lesson_responses: learner upsert own" on public.lesson_responses;
create policy "lesson_responses: learner upsert own" on public.lesson_responses for insert
  with check (auth.uid() = user_id);

drop policy if exists "lesson_responses: learner update own" on public.lesson_responses;
create policy "lesson_responses: learner update own" on public.lesson_responses for update
  using (auth.uid() = user_id);

-- Admins and instructors can read all responses (for grading / review)
drop policy if exists "lesson_responses: staff read all" on public.lesson_responses;
create policy "lesson_responses: staff read all" on public.lesson_responses for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- Index for the common lookup pattern: all responses for a lesson
create index if not exists lesson_responses_lesson_id_idx
  on public.lesson_responses (lesson_id);

-- Index for fetching all responses by a user across a course
create index if not exists lesson_responses_user_course_idx
  on public.lesson_responses (user_id, course_id);
