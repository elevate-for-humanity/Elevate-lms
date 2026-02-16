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
