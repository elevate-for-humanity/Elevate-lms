-- Dedicated table for in-video quiz answers from InteractiveVideoPlayer.
-- Replaces the lesson_progress.metadata workaround.

create table if not exists public.interactive_video_quiz_answers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  lesson_id     uuid not null,
  question      text not null,
  selected_answer integer not null,
  correct_answer  integer not null,
  is_correct    boolean not null,
  timestamp_sec numeric,
  answered_at   timestamptz not null default now()
);

-- One row per user+lesson+question — upsert on re-attempt keeps latest answer
create unique index if not exists uq_video_quiz_answer
  on public.interactive_video_quiz_answers (user_id, lesson_id, question);

-- RLS: users can only read/write their own answers
alter table public.interactive_video_quiz_answers enable row level security;

create policy "users_own_video_quiz_answers"
  on public.interactive_video_quiz_answers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast per-lesson lookups
create index if not exists idx_video_quiz_lesson
  on public.interactive_video_quiz_answers (lesson_id, user_id);
