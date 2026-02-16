-- =============================================
-- EFH LMS Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Programs (public catalog)
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  track text not null,
  blurb text,
  hours text,
  cover_url text,
  created_at timestamp with time zone default now()
);

-- Courses
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete set null,
  code text not null,
  title text not null,
  summary text,
  cover_url text,
  created_at timestamptz default now()
);
create index if not exists idx_courses_program_id on courses(program_id);

-- Lessons
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  idx int not null,
  title text not null,
  video_url text,
  html text,
  created_at timestamptz default now()
);
create index if not exists idx_lessons_course_id_idx on lessons(course_id, idx);

-- Enrollments
create table if not exists enrollments (
  user_id uuid not null,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- Lesson Progress
create table if not exists lesson_progress (
  user_id uuid not null,
  lesson_id uuid not null references lessons(id) on delete cascade,
  percent int not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, lesson_id)
);

-- Quiz Questions
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  prompt text not null,
  options text[] not null default '{}',
  answer text
);

-- Quiz Responses
create table if not exists quiz_responses (
  question_id uuid references quiz_questions(id) on delete cascade,
  user_id uuid not null,
  answer text,
  created_at timestamptz default now()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
alter table programs enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_responses enable row level security;

-- Public read for catalog
create policy "programs are readable" on programs for select using (true);
create policy "courses readable" on courses for select using (true);
create policy "lessons readable" on lessons for select using (true);

-- Authenticated for learning records
create policy "enrollments by owner" on enrollments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "progress by owner" on lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quiz read" on quiz_questions for select using (true);

create policy "quiz responses owner" on quiz_responses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================
-- Seed Sample Data
-- =============================================

-- Insert sample programs
insert into programs (slug, title, track, blurb, hours, cover_url) values
  ('cna-hha', 'CNA / HHA', 'Healthcare', 'State-aligned training with clinicals and direct employer placement.', '4–8 weeks', '/programs/cna.jpg'),
  ('welding-aws', 'Welding (AWS SENSE)', 'Construction', 'Hands-on welding lab and industry-recognized AWS SENSE credentials.', '6–10 weeks', '/programs/welding.jpg'),
  ('nail-tech', 'Nail Technology', 'Beauty', 'State board preparation with salon-ready portfolio and sanitation.', '8–12 weeks', '/programs/nails.jpg'),
  ('cdl', 'CDL (A/B) Prep', 'Business', 'Permit prep, simulator practice, and employer-ready onboarding.', '3–6 weeks', '/programs/cdl.jpg'),
  ('office-tech', 'Office Tech & AI', 'Tech', 'Docs, Sheets, CRM, and AI workflows for modern office careers.', '4–6 weeks', '/programs/office.jpg'),
  ('osha10', 'OSHA-10 + CPR', 'Construction', 'Worksite safety fundamentals plus life-saving CPR/AED certification.', '1–2 weeks', '/programs/osha.jpg')
on conflict (slug) do nothing;

-- Insert sample course
insert into courses (program_id, code, title, summary)
select id, 'HLTH-101', 'Patient Care Basics', 'Intro to patient care, HIPAA, and safety.'
from programs where slug='cna-hha'
on conflict do nothing;

-- Insert sample lesson
insert into lessons (course_id, idx, title, video_url, html)
select c.id, 1, 'Hand Hygiene', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '<p>Proper hand hygiene saves lives. Follow the 7-step process for effective handwashing.</p>'
from courses c where c.code='HLTH-101'
on conflict do nothing;

-- Insert sample quiz question
insert into quiz_questions (lesson_id, prompt, options, answer)
select l.id, 'Which is the best time to wash hands?', array['Before patient contact','After removing gloves','Both'], 'Both'
from lessons l
join courses c on l.course_id = c.id
where c.code='HLTH-101' and l.idx = 1
on conflict do nothing;

-- =============================================
-- Success Message
-- =============================================
do $$
begin
  raise notice 'LMS schema created successfully!';
  raise notice 'Sample data inserted: 6 programs, 1 course, 1 lesson, 1 quiz question';
end $$;
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
-- Creates core analytics tables and helpers for dashboard visibility.
create extension if not exists "uuid-ossp";

create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  actor jsonb,
  properties jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.analytics_events is 'Normalized event log used for analytics dashboards and KPIs.';
comment on column public.analytics_events.event_type is 'Domain event identifier, e.g. course.enrolled or video.completed.';
comment on column public.analytics_events.actor is 'JSON object capturing user metadata at time of event (id, role, email).';
comment on column public.analytics_events.properties is 'Arbitrary JSON payload describing the event context.';

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_type_idx on public.analytics_events (event_type);

create or replace view public.analytics_daily_activity as
with days as (
  select generate_series(current_date - interval '29 days', current_date, interval '1 day')::date as day
),
counts as (
  select date_trunc('day', created_at)::date as day,
         count(*) as events,
         count(distinct actor ->> 'id') as unique_actors
  from public.analytics_events
  where created_at >= current_date - interval '29 days'
  group by 1
)
select d.day,
       coalesce(c.events, 0) as events,
       coalesce(c.unique_actors, 0) as unique_actors
from days d
left join counts c on d.day = c.day
order by d.day asc;

comment on view public.analytics_daily_activity is '30 day rolling window of total events and unique actors.';

create or replace function public.analytics_dashboard_metrics()
returns jsonb
language sql
stable
as
$$
  with series as (
    select * from public.analytics_daily_activity
  ),
  top_events as (
    select event_type, count(*) as total
    from public.analytics_events
    where created_at >= now() - interval '30 days'
    group by event_type
    order by total desc
    limit 5
  ),
  recent_students as (
    select count(distinct actor ->> 'id')::integer as total
    from public.analytics_events
    where created_at >= now() - interval '30 days'
      and coalesce(actor ->> 'role', '') = 'student'
  )
  select jsonb_build_object(
    'totalEvents', (select count(*) from public.analytics_events),
    'eventsLast7Days', (
      select count(*)
      from public.analytics_events
      where created_at >= now() - interval '7 days'
    ),
    'activeStudentsLast30Days', coalesce((select total from recent_students), 0),
    'series', (
      select jsonb_agg(
        jsonb_build_object('date', day, 'events', events, 'uniqueActors', unique_actors)
        order by day
      )
      from series
    ),
    'topEvents', coalesce((
      select jsonb_agg(jsonb_build_object('eventType', event_type, 'total', total))
      from top_events
    ), '[]'::jsonb)
  );
$$;

comment on function public.analytics_dashboard_metrics is 'Bundles headline KPI metrics for the admin analytics dashboard.';
-- Add Missing RLS Policies
-- This migration adds comprehensive RLS policies for tables that were missing them

-- ============================================
-- MODULES TABLE POLICIES
-- ============================================

-- Allow everyone to view modules for published courses
CREATE POLICY "Modules are viewable for published courses" ON public.modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.published = true
        )
        OR
        -- Instructors can view their own course modules
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.instructor_id = auth.uid()
        )
        OR
        -- Enrolled students can view modules
        EXISTS (
            SELECT 1 FROM public.enrollments
            JOIN public.courses ON courses.id = enrollments.course_id
            WHERE courses.id = modules.course_id
            AND enrollments.user_id = auth.uid()
        )
    );

-- Instructors can insert modules for their courses
CREATE POLICY "Instructors can insert modules" ON public.modules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can update their own course modules
CREATE POLICY "Instructors can update own modules" ON public.modules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can delete their own course modules
CREATE POLICY "Instructors can delete own modules" ON public.modules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================
-- ASSIGNMENTS TABLE POLICIES
-- ============================================

-- Students can view assignments for courses they're enrolled in
CREATE POLICY "Students can view assignments for enrolled courses" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            JOIN public.enrollments ON enrollments.course_id = courses.id
            WHERE modules.id = assignments.module_id
            AND enrollments.user_id = auth.uid()
        )
        OR
        -- Instructors can view assignments for their courses
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            WHERE modules.id = assignments.module_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can insert assignments for their course modules
CREATE POLICY "Instructors can insert assignments" ON public.assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            WHERE modules.id = assignments.module_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can update assignments for their courses
CREATE POLICY "Instructors can update assignments" ON public.assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            WHERE modules.id = assignments.module_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can delete assignments for their courses
CREATE POLICY "Instructors can delete assignments" ON public.assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            WHERE modules.id = assignments.module_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================
-- MODULE_PROGRESS TABLE - ADD UPDATE POLICY
-- ============================================

-- Users can update their own progress
CREATE POLICY "Users can update own module progress" ON public.module_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE enrollments.id = module_progress.enrollment_id
            AND enrollments.user_id = auth.uid()
        )
    );

-- ============================================
-- SUBMISSIONS TABLE - ADD MISSING POLICIES
-- ============================================

-- Instructors can view submissions for their courses
CREATE POLICY "Instructors can view course submissions" ON public.submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assignments
            JOIN public.modules ON modules.id = assignments.module_id
            JOIN public.courses ON courses.id = modules.course_id
            WHERE assignments.id = submissions.assignment_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Users can update their own submissions (for resubmissions)
CREATE POLICY "Users can update own submissions" ON public.submissions
    FOR UPDATE USING (auth.uid() = user_id);

-- Instructors can update submissions (for grading)
CREATE POLICY "Instructors can update submissions for grading" ON public.submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.assignments
            JOIN public.modules ON modules.id = assignments.module_id
            JOIN public.courses ON courses.id = modules.course_id
            WHERE assignments.id = submissions.assignment_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================
-- CERTIFICATES TABLE - ADD MISSING POLICIES
-- ============================================

-- Allow public viewing of certificates (for verification)
CREATE POLICY "Certificates are publicly viewable" ON public.certificates
    FOR SELECT USING (true);

-- System can insert certificates (via trigger or admin)
-- Note: This is handled by SECURITY DEFINER functions, but we add a policy for explicit admin inserts
CREATE POLICY "System can insert certificates" ON public.certificates
    FOR INSERT WITH CHECK (
        -- Only allow if user completed the course
        EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE enrollments.user_id = certificates.user_id
            AND enrollments.course_id = certificates.course_id
            AND enrollments.status = 'completed'
        )
    );

-- ============================================
-- ENROLLMENTS TABLE - ADD DELETE POLICY
-- ============================================

-- Users can delete their own enrollments (unenroll)
CREATE POLICY "Users can delete own enrollments" ON public.enrollments
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- COURSES TABLE - ADD DELETE POLICY
-- ============================================

-- Instructors can delete their own courses
CREATE POLICY "Instructors can delete own courses" ON public.courses
    FOR DELETE USING (auth.uid() = instructor_id);

-- ============================================
-- PROFILES TABLE - ADD DELETE POLICY
-- ============================================

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);
-- Enable row level security and define baseline policies for analytics events.
alter table public.analytics_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_events'
      and policyname = 'allow_insert_from_authenticated_clients'
  ) then
    create policy allow_insert_from_authenticated_clients
      on public.analytics_events
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_events'
      and policyname = 'allow_service_role_full_access'
  ) then
    create policy allow_service_role_full_access
      on public.analytics_events
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

alter function public.analytics_dashboard_metrics() security definer;
alter function public.analytics_dashboard_metrics() set search_path = public;
comment on function public.analytics_dashboard_metrics is 'Bundles headline KPI metrics for the admin analytics dashboard (executes as definer to avoid RLS friction).';
-- Migration: Create tables for automation functions
-- Created: 2025-01-27

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  program_name TEXT NOT NULL,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  funding_source TEXT DEFAULT 'self-pay',
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job placements table
CREATE TABLE IF NOT EXISTS job_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  starting_salary NUMERIC,
  employment_type TEXT DEFAULT 'full-time',
  placement_date TIMESTAMPTZ DEFAULT NOW(),
  industry TEXT,
  location TEXT,
  benefits JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_funding_source ON enrollments(funding_source);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_job_placements_student_id ON job_placements(student_id);
CREATE INDEX IF NOT EXISTS idx_job_placements_enrollment_id ON job_placements(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_job_placements_placement_date ON job_placements(placement_date);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_type_date ON reports(report_type, generated_at);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)

-- Students: Service role can do everything
CREATE POLICY "Service role full access on students"
  ON students
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enrollments: Service role can do everything
CREATE POLICY "Service role full access on enrollments"
  ON enrollments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Job placements: Service role can do everything
CREATE POLICY "Service role full access on job_placements"
  ON job_placements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Activity log: Service role can do everything
CREATE POLICY "Service role full access on activity_log"
  ON activity_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Reports: Service role can do everything
CREATE POLICY "Service role full access on reports"
  ON reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_placements_updated_at
  BEFORE UPDATE ON job_placements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Migration: Create generated content table
-- Created: 2025-01-27

-- Generated content table
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content Details
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  program TEXT,
  theme TEXT,
  content TEXT NOT NULL,
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  
  -- Scheduling
  scheduled_date TIMESTAMPTZ,
  published_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  
  -- Engagement Metrics
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  
  -- Metadata
  generated_by TEXT DEFAULT 'openai',
  edited_by UUID,
  approved_by UUID,
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_generated_content_platform ON generated_content(platform);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_generated_content_scheduled_date ON generated_content(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_generated_content_content_type ON generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_program ON generated_content(program);

-- Enable Row Level Security
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Service role full access
CREATE POLICY "Service role full access on generated_content"
  ON generated_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view published content
CREATE POLICY "Authenticated users can view published content"
  ON generated_content
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Add updated_at trigger
CREATE TRIGGER update_generated_content_updated_at
  BEFORE UPDATE ON generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Migration: Create scholarship applications table
-- Created: 2025-01-27

-- Scholarship applications table
CREATE TABLE IF NOT EXISTS scholarship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  
  -- Scholarship & Program
  scholarship_type TEXT NOT NULL,
  program_interest TEXT NOT NULL,
  
  -- Eligibility
  household_income TEXT NOT NULL,
  household_size INTEGER NOT NULL,
  employment_status TEXT NOT NULL,
  education_level TEXT NOT NULL,
  
  -- Circumstances
  is_single_parent BOOLEAN DEFAULT false,
  is_formerly_incarcerated BOOLEAN DEFAULT false,
  is_homeless BOOLEAN DEFAULT false,
  is_veteran BOOLEAN DEFAULT false,
  has_disability BOOLEAN DEFAULT false,
  
  -- Essays
  why_scholarship TEXT NOT NULL,
  career_goals TEXT NOT NULL,
  financial_need TEXT,
  
  -- Uploaded Files
  proof_of_income_url TEXT,
  identification_url TEXT,
  additional_docs_url TEXT,
  
  -- Status & Tracking
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  decision TEXT,
  decision_notes TEXT,
  award_amount NUMERIC,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_email ON scholarship_applications(email);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_status ON scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_scholarship_type ON scholarship_applications(scholarship_type);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_submitted_at ON scholarship_applications(submitted_at);

-- Enable Row Level Security
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Service role full access
CREATE POLICY "Service role full access on scholarship_applications"
  ON scholarship_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Applicants can view their own applications
CREATE POLICY "Applicants can view own applications"
  ON scholarship_applications
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Add updated_at trigger
CREATE TRIGGER update_scholarship_applications_updated_at
  BEFORE UPDATE ON scholarship_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Service role can upload documents"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Service role can read documents"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'scholarship-applications' AND
    (storage.foldername(name))[2] = auth.jwt() ->> 'email'
  );
-- Migration: Create tables for Stripe split payouts
-- Created: 2025-01-27

-- Instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  stripe_account_id TEXT UNIQUE,
  stripe_account_status TEXT DEFAULT 'pending',
  payout_percentage NUMERIC DEFAULT 80.00,
  bio TEXT,
  specialties TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Split payouts table
CREATE TABLE IF NOT EXISTS split_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
  total_amount INTEGER NOT NULL,
  efh_amount INTEGER NOT NULL,
  instructor_amount INTEGER NOT NULL,
  selfish_inc_amount INTEGER NOT NULL,
  platform_amount INTEGER NOT NULL,
  transfers JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instructor programs junction table
CREATE TABLE IF NOT EXISTS instructor_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  program_name TEXT NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_stripe_account ON instructors(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_split_payouts_payment_intent ON split_payouts(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_split_payouts_instructor ON split_payouts(instructor_id);
CREATE INDEX IF NOT EXISTS idx_split_payouts_created_at ON split_payouts(created_at);
CREATE INDEX IF NOT EXISTS idx_split_payouts_status ON split_payouts(status);
CREATE INDEX IF NOT EXISTS idx_instructor_programs_instructor ON instructor_programs(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_programs_program ON instructor_programs(program_id);

-- Enable Row Level Security
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Instructors: Service role full access
CREATE POLICY "Service role full access on instructors"
  ON instructors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Instructors: Authenticated users can view
CREATE POLICY "Authenticated users can view instructors"
  ON instructors
  FOR SELECT
  TO authenticated
  USING (true);

-- Split payouts: Service role full access
CREATE POLICY "Service role full access on split_payouts"
  ON split_payouts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Instructor programs: Service role full access
CREATE POLICY "Service role full access on instructor_programs"
  ON instructor_programs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Instructor programs: Authenticated users can view
CREATE POLICY "Authenticated users can view instructor_programs"
  ON instructor_programs
  FOR SELECT
  TO authenticated
  USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_instructors_updated_at
  BEFORE UPDATE ON instructors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_split_payouts_updated_at
  BEFORE UPDATE ON split_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample instructors (optional - remove in production)
INSERT INTO instructors (first_name, last_name, email, payout_percentage, specialties) VALUES
  ('Sarah', 'Johnson', 'sarah.johnson@example.com', 80.00, ARRAY['Tax Preparation', 'Business Formation']),
  ('Michael', 'Davis', 'michael.davis@example.com', 80.00, ARRAY['Barbering', 'Cosmetology']),
  ('Jennifer', 'Martinez', 'jennifer.martinez@example.com', 80.00, ARRAY['Healthcare', 'CPR/First Aid']),
  ('Robert', 'Wilson', 'robert.wilson@example.com', 80.00, ARRAY['Construction', 'OSHA Safety'])
ON CONFLICT (email) DO NOTHING;
