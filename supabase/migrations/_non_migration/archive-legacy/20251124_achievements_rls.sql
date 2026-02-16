-- ============================================
-- ACHIEVEMENTS RLS POLICIES
-- Pack 6: Achievement System
-- ============================================

-- Secure achievements table with RLS & basic policies
alter table public.achievements enable row level security;

drop policy if exists "Users can view own achievements" on public.achievements;
create policy "Users can view own achievements"
  on public.achievements for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own achievements" on public.achievements;
create policy "Users can insert own achievements"
  on public.achievements for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own achievements" on public.achievements;
create policy "Users can update own achievements"
  on public.achievements for update
  using (auth.uid() = user_id);

comment on table public.achievements is 'Stores earned badges and achievements for gamification';
