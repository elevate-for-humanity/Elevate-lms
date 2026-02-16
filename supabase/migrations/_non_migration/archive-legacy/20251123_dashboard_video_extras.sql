-- =====================================================
-- DASHBOARD & VIDEO ENHANCEMENTS MIGRATION
-- Adds missing tables for video progress, reviews, notifications, etc.
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1) Track video progress
create table if not exists public.video_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  last_position_seconds int not null default 0,
  duration_seconds int not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- Index for fast lookups
create index if not exists idx_video_progress_user on public.video_progress(user_id);
create index if not exists idx_video_progress_lesson on public.video_progress(lesson_id);

-- Enable RLS
alter table public.video_progress enable row level security;

-- Users can only see/update their own progress
create policy "Users can view own video progress"
  on public.video_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own video progress"
  on public.video_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own video progress"
  on public.video_progress for update
  using (auth.uid() = user_id);

-- 2) Course reviews
create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, user_id)
);

-- Index for fast lookups
create index if not exists idx_course_reviews_course on public.course_reviews(course_id);
create index if not exists idx_course_reviews_user on public.course_reviews(user_id);

-- Enable RLS
alter table public.course_reviews enable row level security;

-- Anyone can read reviews
create policy "Anyone can view course reviews"
  on public.course_reviews for select
  using (true);

-- Users can only create/update their own reviews
create policy "Users can insert own reviews"
  on public.course_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.course_reviews for update
  using (auth.uid() = user_id);

-- 3) Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'deadline', 'announcement', 'grade', 'message', etc.
  title text not null,
  body text,
  url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for fast lookups
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);

-- Enable RLS
alter table public.notifications enable row level security;

-- Users can only see their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Admins/instructors can create notifications
create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (true); -- TODO: Add proper role check

-- 4) Bookmarks (timestamps in video)
create table if not exists public.video_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  label text,
  position_seconds int not null default 0,
  created_at timestamptz not null default now()
);

-- Index for fast lookups
create index if not exists idx_video_bookmarks_user_lesson on public.video_bookmarks(user_id, lesson_id);

-- Enable RLS
alter table public.video_bookmarks enable row level security;

-- Users can only manage their own bookmarks
create policy "Users can view own bookmarks"
  on public.video_bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.video_bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookmarks"
  on public.video_bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.video_bookmarks for delete
  using (auth.uid() = user_id);

-- 5) Notes (per lesson with timestamp)
create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position_seconds int,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups
create index if not exists idx_lesson_notes_user_lesson on public.lesson_notes(user_id, lesson_id);

-- Enable RLS
alter table public.lesson_notes enable row level security;

-- Users can only manage their own notes
create policy "Users can view own notes"
  on public.lesson_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.lesson_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.lesson_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.lesson_notes for delete
  using (auth.uid() = user_id);

-- 6) Simple announcements table (per course)
create table if not exists public.course_announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups
create index if not exists idx_course_announcements_course on public.course_announcements(course_id);

-- Enable RLS
alter table public.course_announcements enable row level security;

-- Anyone can read announcements
create policy "Anyone can view course announcements"
  on public.course_announcements for select
  using (true);

-- Only instructors/admins can create announcements
create policy "Instructors can insert announcements"
  on public.course_announcements for insert
  with check (true); -- TODO: Add proper role check

create policy "Authors can update own announcements"
  on public.course_announcements for update
  using (auth.uid() = author_id);

create policy "Authors can delete own announcements"
  on public.course_announcements for delete
  using (auth.uid() = author_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get course progress for a user
create or replace function get_course_progress(p_user_id uuid, p_course_id uuid)
returns numeric as $$
declare
  total_lessons int;
  completed_lessons int;
begin
  -- Get total lessons in course
  select count(*)
  into total_lessons
  from lessons l
  join modules m on m.id = l.module_id
  where m.course_id = p_course_id;

  -- Get completed lessons
  select count(*)
  into completed_lessons
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  join modules m on m.id = l.module_id
  where m.course_id = p_course_id
    and lp.user_id = p_user_id
    and lp.completed = true;

  -- Return percentage
  if total_lessons = 0 then
    return 0;
  else
    return round((completed_lessons::numeric / total_lessons::numeric) * 100, 2);
  end if;
end;
$$ language plpgsql security definer;

-- Function to get average course rating
create or replace function get_course_rating(p_course_id uuid)
returns numeric as $$
declare
  avg_rating numeric;
begin
  select round(avg(rating), 1)
  into avg_rating
  from course_reviews
  where course_id = p_course_id;

  return coalesce(avg_rating, 0);
end;
$$ language plpgsql security definer;

-- =====================================================
-- SEED SOME SAMPLE NOTIFICATIONS (OPTIONAL)
-- =====================================================

-- Uncomment to add sample notifications for testing
-- insert into public.notifications (user_id, type, title, body, url)
-- select 
--   u.id,
--   'announcement',
--   'Welcome to Elevate LMS!',
--   'Start your learning journey today. Browse our courses and enroll in programs that match your career goals.',
--   '/lms/courses'
-- from auth.users u
-- limit 10;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
