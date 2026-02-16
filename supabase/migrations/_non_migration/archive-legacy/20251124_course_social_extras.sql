-- ==========================================
-- COURSE SOCIAL FEATURES: FORUM + Q&A
-- ==========================================

-- Course-level discussion threads
create table if not exists public.discussion_threads (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_discussion_threads_course
  on public.discussion_threads(course_id);

alter table public.discussion_threads enable row level security;

create policy "Anyone can view discussion threads"
  on public.discussion_threads for select
  using (true);

create policy "Users can insert own threads"
  on public.discussion_threads for insert
  with check (auth.uid() = author_id);

-- Replies inside a thread
create table if not exists public.discussion_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discussion_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_discussion_posts_thread
  on public.discussion_posts(thread_id);

alter table public.discussion_posts enable row level security;

create policy "Anyone can view discussion posts"
  on public.discussion_posts for select
  using (true);

create policy "Users can insert own posts"
  on public.discussion_posts for insert
  with check (auth.uid() = author_id);

-- Lesson-level Q&A
create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_questions_lesson
  on public.lesson_questions(lesson_id);

alter table public.lesson_questions enable row level security;

create policy "Anyone can view lesson questions"
  on public.lesson_questions for select
  using (true);

create policy "Users can insert own questions"
  on public.lesson_questions for insert
  with check (auth.uid() = author_id);

create table if not exists public.lesson_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.lesson_questions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_answers_question
  on public.lesson_answers(question_id);

alter table public.lesson_answers enable row level security;

create policy "Anyone can view lesson answers"
  on public.lesson_answers for select
  using (true);

create policy "Users can insert own answers"
  on public.lesson_answers for insert
  with check (auth.uid() = author_id);

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
