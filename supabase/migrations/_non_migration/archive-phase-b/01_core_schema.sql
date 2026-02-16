-- 01_core_schema.sql
-- Core schema for Elevate For Humanity LMS + marketing integration

----------------------------------------------------------------
-- PROGRAMS (pathways: Barber, MA, HVAC, CDL, Readiness, etc.)
----------------------------------------------------------------
create table if not exists programs (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,                -- e.g. 'barber-apprenticeship'
  title text not null,                      -- e.g. 'Barber Apprenticeship Pathway'
  category text not null,                   -- 'healthcare','barber_beauty','trades','cdl','readiness_reentry'
  description text,
  outcomes text,                            -- long-form outcomes
  level text,                               -- 'intro','intermediate','advanced'
  mode text not null default 'in-person',   -- 'in-person','hybrid','online'
  estimated_weeks int,
  estimated_hours int,
  funding_tags text[] default '{}',         -- e.g. ARRAY['WIOA','WRG','JRI','OJT']
  approvals jsonb default '{}'::jsonb,      -- e.g. { "intraining_code": "...", "wrg_code": "..." }
  show_on_marketing boolean default true,
  show_in_catalog boolean default true,
  is_active boolean default true,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_programs_slug on programs(slug);
create index if not exists idx_programs_category on programs(category);
create index if not exists idx_programs_active on programs(is_active);

----------------------------------------------------------------
-- MODULES (sections inside programs)
----------------------------------------------------------------
create table if not exists modules (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references programs(id) on delete cascade,
  title text not null,
  summary text,
  order_index int not null default 1,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_modules_program_id on modules(program_id);
create index if not exists idx_modules_program_order on modules(program_id, order_index);

----------------------------------------------------------------
-- LESSONS (actual content units: video, reading, quiz)
----------------------------------------------------------------
create table if not exists lessons (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references programs(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  lesson_type text not null default 'video',  -- 'video','reading','quiz','assignment'
  video_url text,
  content_url text,                           -- pdf, article, etc.
  quiz_id uuid,                               -- optional future table
  order_index int not null default 1,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists idx_lessons_program_id on lessons(program_id);
create index if not exists idx_lessons_module_id on lessons(module_id);
create index if not exists idx_lessons_module_order on lessons(module_id, order_index);

----------------------------------------------------------------
-- ENROLLMENTS (who is in which program)
----------------------------------------------------------------
create table if not exists enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,                         -- references auth.users(id) logically
  program_id uuid not null references programs(id) on delete cascade,
  status text not null default 'active',         -- 'active','completed','withdrawn','paused'
  started_at timestamptz default timezone('utc', now()),
  completed_at timestamptz,
  source text,                                   -- 'application','case_manager','employer','self_enroll'
  funding_type text,                             -- 'WIOA','WRG','JRI','OJT','WEX','self-pay', etc.
  created_at timestamptz default timezone('utc', now())
);

create index if not exists idx_enrollments_user on enrollments(user_id);
create index if not exists idx_enrollments_program on enrollments(program_id);
create index if not exists idx_enrollments_status on enrollments(status);

----------------------------------------------------------------
-- LESSON PROGRESS (per-lesson tracking)
----------------------------------------------------------------
create table if not exists lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status text not null default 'not_started',    -- 'not_started','in_progress','completed'
  last_viewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create unique index if not exists idx_progress_enrollment_lesson
  on lesson_progress(enrollment_id, lesson_id);

create index if not exists idx_progress_status
  on lesson_progress(status);

----------------------------------------------------------------
-- CERTIFICATES (issued on completion)
----------------------------------------------------------------
create table if not exists certificates (
  id uuid primary key default uuid_generate_v4(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  user_id uuid not null,
  program_id uuid not null references programs(id) on delete cascade,
  certificate_number text unique,
  issued_at timestamptz default timezone('utc', now()),
  pdf_url text,
  created_at timestamptz default timezone('utc', now())
);

create index if not exists idx_certificates_user on certificates(user_id);
create index if not exists idx_certificates_program on certificates(program_id);

----------------------------------------------------------------
-- APPLICATIONS (from marketing site)
----------------------------------------------------------------
create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  first_name text,
  last_name text,
  email text,
  phone text,
  program text,
  notes text,
  source text default 'marketing_site',           -- 'marketing_site','workone','social','court', etc.
  status text default 'submitted',                -- 'submitted','in_review','approved','declined','converted'
  created_at timestamptz default timezone('utc', now())
);

create index if not exists idx_applications_status on applications(status);
create index if not exists idx_applications_program on applications(program);
create index if not exists idx_applications_created_at on applications(created_at);

----------------------------------------------------------------
-- CONTACT MESSAGES (from website contact form)
----------------------------------------------------------------
create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text,
  subject text,
  message text,
  created_at timestamptz default timezone('utc', now())
);

create index if not exists idx_contact_messages_created_at on contact_messages(created_at);
