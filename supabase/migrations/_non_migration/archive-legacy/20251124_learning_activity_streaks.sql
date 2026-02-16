-- ============================================
-- LEARNING ACTIVITY FOR STREAKS & GOALS
-- Pack 6: Live Streak & Goals System
-- ============================================

-- Activity log for tracking daily watch time
create table if not exists public.learning_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  seconds_watched int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create index if not exists idx_learning_activity_user_date
  on public.learning_activity(user_id, activity_date);

alter table public.learning_activity enable row level security;

create policy "Users can view own learning activity"
  on public.learning_activity for select
  using (auth.uid() = user_id);

create policy "Users can insert own learning activity"
  on public.learning_activity for insert
  with check (auth.uid() = user_id);

create policy "Users can update own learning activity"
  on public.learning_activity for update
  using (auth.uid() = user_id);

-- Ensure daily_streaks has proper RLS (table created in earlier migration)
alter table public.daily_streaks enable row level security;

drop policy if exists "Users can view own streaks" on public.daily_streaks;
create policy "Users can view own streaks"
  on public.daily_streaks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own streaks" on public.daily_streaks;
create policy "Users can insert own streaks"
  on public.daily_streaks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own streaks" on public.daily_streaks;
create policy "Users can update own streaks"
  on public.daily_streaks for update
  using (auth.uid() = user_id);

-- Ensure learning_goals has proper RLS (table created in earlier migration)
alter table public.learning_goals enable row level security;

drop policy if exists "Users can view own goals" on public.learning_goals;
create policy "Users can view own goals"
  on public.learning_goals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own goals" on public.learning_goals;
create policy "Users can insert own goals"
  on public.learning_goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own goals" on public.learning_goals;
create policy "Users can update own goals"
  on public.learning_goals for update
  using (auth.uid() = user_id);

-- Helper function to increment activity (alternative to upsert in app code)
create or replace function public.increment_learning_activity(
  p_user_id uuid,
  p_seconds int
)
returns void
language plpgsql
security definer
as $$
declare
  v_today date := current_date;
begin
  insert into public.learning_activity (user_id, activity_date, seconds_watched)
  values (p_user_id, v_today, p_seconds)
  on conflict (user_id, activity_date)
  do update set
    seconds_watched = public.learning_activity.seconds_watched + p_seconds,
    updated_at = now();
end;
$$;

comment on table public.learning_activity is 'Tracks daily watch time for streak and goal calculations';
comment on function public.increment_learning_activity is 'Atomically increments daily watch time for a user';
