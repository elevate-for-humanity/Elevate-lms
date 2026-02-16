-- =============================================
-- EFH LMS Part 2: Auth, Instructor Tools, Certificates
-- Run this AFTER 001_lms_schema.sql
-- =============================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'student' check (role in ('student', 'instructor', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Certificates
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  certificate_number text unique not null,
  issued_at timestamptz default now(),
  unique(user_id, course_id)
);

create index if not exists idx_certificates_user_id on certificates(user_id);
create index if not exists idx_certificates_number on certificates(certificate_number);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

alter table profiles enable row level security;
alter table certificates enable row level security;

-- Profiles: Users can read all profiles, but only update their own
create policy "profiles are readable" on profiles for select using (true);

create policy "users can update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Certificates: Public read for verification, users can see their own
create policy "certificates readable by owner" on certificates
  for select using (auth.uid() = user_id or true);

create policy "certificates insertable by system" on certificates
  for insert with check (auth.uid() = user_id);

-- =============================================
-- Functions
-- =============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to check course completion
create or replace function check_course_completion(
  p_user_id uuid,
  p_course_id uuid
) returns boolean as $$
declare
  total_lessons int;
  completed_lessons int;
begin
  -- Count total lessons
  select count(*) into total_lessons
  from lessons
  where course_id = p_course_id;

  -- Count completed lessons (100% progress)
  select count(*) into completed_lessons
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  where l.course_id = p_course_id
    and lp.user_id = p_user_id
    and lp.percent = 100;

  return total_lessons > 0 and total_lessons = completed_lessons;
end;
$$ language plpgsql;

-- =============================================
-- Seed Data
-- =============================================

-- Create sample instructor account (password: instructor123)
-- Note: You'll need to create this user via Supabase Auth UI or API
-- Then update their role:
-- UPDATE profiles SET role = 'instructor' WHERE email = 'instructor@example.com';

-- =============================================
-- Success Message
-- =============================================
do $$
begin
  raise notice 'Part 2 schema created successfully!';
  raise notice 'Added: profiles, certificates tables';
  raise notice 'Added: RLS policies, triggers, functions';
  raise notice 'Next: Create instructor user and update role in profiles table';
end $$;
