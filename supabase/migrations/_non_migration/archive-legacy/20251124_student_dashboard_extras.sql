-- ==========================================
-- STUDENT DASHBOARD EXTRAS (GOALS / STREAK / ACHIEVEMENTS)
-- ==========================================

-- Learning goals (daily minutes target)
create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_minutes int not null default 20,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.learning_goals enable row level security;

create policy "Users can view own learning goals"
  on public.learning_goals for select
  using (auth.uid() = user_id);

create policy "Users can upsert own learning goals"
  on public.learning_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own learning goals"
  on public.learning_goals for update
  using (auth.uid() = user_id);

-- Daily streaks (login / activity streak)
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

create policy "Users can view own streak"
  on public.daily_streaks for select
  using (auth.uid() = user_id);

create policy "Users can update own streak"
  on public.daily_streaks for update
  using (auth.uid() = user_id);

create policy "Users can insert own streak"
  on public.daily_streaks for insert
  with check (auth.uid() = user_id);

-- Achievements (badges)
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null, -- e.g. 'FIRST_LOGIN', 'FIRST_COURSE', 'STREAK_7'
  label text not null,
  description text,
  earned_at timestamptz not null default now(),
  unique (user_id, code)
);

alter table public.achievements enable row level security;

create policy "Users can view own achievements"
  on public.achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on public.achievements for insert
  with check (auth.uid() = user_id);

-- Add assignments table if it doesn't exist (for deadlines)
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

create policy "Anyone can view assignments"
  on public.assignments for select
  using (true);

-- Helper function to update streak automatically
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
    
    -- Award achievements for streaks
    if v_streak.current_streak + 1 = 3 then
      insert into achievements (user_id, code, label, description)
      values (p_user_id, 'STREAK_3', '3-Day Streak', 'Learned for 3 days in a row')
      on conflict (user_id, code) do nothing;
    elsif v_streak.current_streak + 1 = 7 then
      insert into achievements (user_id, code, label, description)
      values (p_user_id, 'STREAK_7', '7-Day Streak', 'Learned for a full week')
      on conflict (user_id, code) do nothing;
    elsif v_streak.current_streak + 1 = 30 then
      insert into achievements (user_id, code, label, description)
      values (p_user_id, 'STREAK_30', '30-Day Streak', 'Learned for a full month')
      on conflict (user_id, code) do nothing;
    end if;
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

-- Helper function to award achievement
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

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
