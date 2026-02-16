-- =====================================================
-- PACK 2: ADDITIONAL FEATURES MIGRATION
-- Study groups, discussions, Q&A, goals, streaks, achievements
-- =====================================================

-- STUDY GROUPS (social / community)
create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_study_groups_course on public.study_groups(course_id);

alter table public.study_groups enable row level security;

create policy "Anyone can view study groups"
  on public.study_groups for select
  using (true);

create policy "Users can create study groups"
  on public.study_groups for insert
  with check (auth.uid() = created_by);

create table if not exists public.study_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists idx_study_group_members_group on public.study_group_members(group_id);
create index if not exists idx_study_group_members_user on public.study_group_members(user_id);

alter table public.study_group_members enable row level security;

create policy "Anyone can view group members"
  on public.study_group_members for select
  using (true);

create policy "Users can join groups"
  on public.study_group_members for insert
  with check (auth.uid() = user_id);

-- DISCUSSION FORUM (course-level)
create table if not exists public.discussion_threads (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_discussion_threads_course on public.discussion_threads(course_id);

alter table public.discussion_threads enable row level security;

create policy "Anyone can view discussion threads"
  on public.discussion_threads for select
  using (true);

create policy "Users can create threads"
  on public.discussion_threads for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own threads"
  on public.discussion_threads for update
  using (auth.uid() = author_id);

create table if not exists public.discussion_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discussion_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_discussion_posts_thread on public.discussion_posts(thread_id);

alter table public.discussion_posts enable row level security;

create policy "Anyone can view discussion posts"
  on public.discussion_posts for select
  using (true);

create policy "Users can create posts"
  on public.discussion_posts for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own posts"
  on public.discussion_posts for update
  using (auth.uid() = author_id);

-- LESSON Q&A (lesson-level questions)
create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_questions_lesson on public.lesson_questions(lesson_id);

alter table public.lesson_questions enable row level security;

create policy "Anyone can view lesson questions"
  on public.lesson_questions for select
  using (true);

create policy "Users can create questions"
  on public.lesson_questions for insert
  with check (auth.uid() = author_id);

create table if not exists public.lesson_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.lesson_questions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_answers_question on public.lesson_answers(question_id);

alter table public.lesson_answers enable row level security;

create policy "Anyone can view lesson answers"
  on public.lesson_answers for select
  using (true);

create policy "Users can create answers"
  on public.lesson_answers for insert
  with check (auth.uid() = author_id);

-- GOALS / STREAKS / ACHIEVEMENTS (gamification)
create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_minutes int not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.learning_goals enable row level security;

create policy "Users can view own goals"
  on public.learning_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.learning_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.learning_goals for update
  using (auth.uid() = user_id);

create table if not exists public.daily_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date not null default current_date,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.daily_streaks enable row level security;

create policy "Users can view own streaks"
  on public.daily_streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on public.daily_streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streaks"
  on public.daily_streaks for update
  using (auth.uid() = user_id);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null, -- e.g. 'FIRST_COURSE', 'STREAK_7', 'COMPLETE_5'
  label text not null,
  description text,
  earned_at timestamptz not null default now(),
  unique (user_id, code)
);

create index if not exists idx_achievements_user on public.achievements(user_id);

alter table public.achievements enable row level security;

create policy "Users can view own achievements"
  on public.achievements for select
  using (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS FOR PACK 2
-- =====================================================

-- Function to update streak
create or replace function update_user_streak(p_user_id uuid)
returns void as $$
declare
  v_streak record;
  v_today date := current_date;
begin
  -- Get or create streak record
  select * into v_streak
  from daily_streaks
  where user_id = p_user_id;

  if not found then
    insert into daily_streaks (user_id, current_streak, longest_streak, last_active_date)
    values (p_user_id, 1, 1, v_today);
    return;
  end if;

  -- Check if already updated today
  if v_streak.last_active_date = v_today then
    return;
  end if;

  -- Check if streak continues (yesterday)
  if v_streak.last_active_date = v_today - interval '1 day' then
    -- Continue streak
    update daily_streaks
    set current_streak = current_streak + 1,
        longest_streak = greatest(longest_streak, current_streak + 1),
        last_active_date = v_today,
        updated_at = now()
    where user_id = p_user_id;
  else
    -- Streak broken, reset to 1
    update daily_streaks
    set current_streak = 1,
        last_active_date = v_today,
        updated_at = now()
    where user_id = p_user_id;
  end if;
end;
$$ language plpgsql security definer;

-- Function to award achievement
create or replace function award_achievement(
  p_user_id uuid,
  p_code text,
  p_label text,
  p_description text default null
)
returns void as $$
begin
  insert into achievements (user_id, code, label, description)
  values (p_user_id, p_code, p_label, p_description)
  on conflict (user_id, code) do nothing;
end;
$$ language plpgsql security definer;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
