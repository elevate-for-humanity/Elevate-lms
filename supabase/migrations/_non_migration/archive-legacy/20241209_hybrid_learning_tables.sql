-- Hybrid Learning System Tables for Barber Apprenticeship (Indiana)
-- Run this migration first before seeding data

-- 1) Programs table (Barber, Healthcare, CDL, etc.)
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null, -- 'Beauty & Barbering', 'Healthcare', 'Skilled Trades', etc.
  description text,
  delivery_mode text, -- 'hybrid', 'online', 'in-person'
  location_state text, -- 'IN', 'OH', 'KY', etc.
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists idx_programs_slug on programs(slug);
create index if not exists idx_programs_category on programs(category);
create index if not exists idx_programs_active on programs(is_active);

-- 2) AI Instructors table (Elizabeth, Marcus, Dr. Sarah, Barber Mentor, etc.)
create table if not exists ai_instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  avatar_image_url text,
  cloned_from_user text,   -- e.g. 'Elizabeth L. Greene'
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) Course modules (stacked credentials / partner pieces)
create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  title text not null,
  short_code text, -- e.g. 'BARB-ORIENT', 'BARB-MILADY-CORE'
  description text,
  order_index integer not null,
  type text not null, -- 'internal' | 'external_partner'
  partner_name text,  -- 'Milady', 'Barbershop Owner', 'Choice Medical', etc.
  external_url text,  -- link to Milady / partner LMS
  required_hours integer, -- optional: fill with your real hour plan
  requires_proof boolean default false, -- does student need to upload certificate?
  ai_instructor_id uuid references ai_instructors(id),
  is_capstone boolean default false,
  implementation_notes text, -- for shop owner responsibilities, what happens in this module
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for fast queries
create index if not exists idx_course_modules_program on course_modules(program_id);
create index if not exists idx_course_modules_order on course_modules(program_id, order_index);
create index if not exists idx_course_modules_type on course_modules(type);

-- 4) Student enrollments (one per program per student)
create table if not exists student_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null, -- link to auth.users.id or your own students table
  program_id uuid references programs(id) on delete cascade,
  stripe_checkout_session_id text,
  status text not null default 'active', -- 'pending' | 'active' | 'completed' | 'dropped'
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_student_enrollments_student on student_enrollments(student_id);
create index if not exists idx_student_enrollments_program on student_enrollments(program_id);
create index if not exists idx_student_enrollments_status on student_enrollments(status);
create index if not exists idx_student_enrollments_stripe on student_enrollments(stripe_checkout_session_id);

-- Unique constraint: one active enrollment per student per program
create unique index if not exists idx_student_enrollments_unique 
  on student_enrollments(student_id, program_id) 
  where status = 'active';

-- 5) Module progress per enrollment
create table if not exists module_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references student_enrollments(id) on delete cascade,
  module_id uuid references course_modules(id) on delete cascade,
  status text not null default 'not_started',
  -- 'not_started' | 'in_progress' | 'awaiting_partner_completion' | 'completed'
  partner_completion_proof_url text, -- upload of Milady/partner cert
  hours_completed integer default 0,
  last_reminder_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_module_progress_enrollment on module_progress(enrollment_id);
create index if not exists idx_module_progress_module on module_progress(module_id);
create index if not exists idx_module_progress_status on module_progress(status);

-- Unique constraint: one progress record per enrollment per module
create unique index if not exists idx_module_progress_unique 
  on module_progress(enrollment_id, module_id);

-- 6) Shop owner / program holder tracking (for barbershop sponsors)
create table if not exists program_holders (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  business_name text not null,
  owner_name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  license_number text, -- barbershop license, etc.
  mentor_barber_name text,
  mentor_barber_license text,
  status text not null default 'active', -- 'pending' | 'active' | 'suspended' | 'inactive'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_program_holders_program on program_holders(program_id);
create index if not exists idx_program_holders_status on program_holders(status);

-- 7) Apprentice hours log (for tracking shop hours)
create table if not exists apprentice_hours_log (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references student_enrollments(id) on delete cascade,
  program_holder_id uuid references program_holders(id) on delete cascade,
  log_date date not null,
  hours_worked decimal(4,2) not null,
  services_performed jsonb, -- { "haircuts": 5, "beard_trims": 3, etc. }
  notes text,
  verified_by text, -- mentor barber name
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_apprentice_hours_enrollment on apprentice_hours_log(enrollment_id);
create index if not exists idx_apprentice_hours_holder on apprentice_hours_log(program_holder_id);
create index if not exists idx_apprentice_hours_date on apprentice_hours_log(log_date);

-- 8) Service requirements tracking (for state board minimums)
create table if not exists service_requirements (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references student_enrollments(id) on delete cascade,
  service_type text not null, -- 'basic_haircuts', 'clipper_cuts', 'fades_and_tapers', etc.
  required_count integer not null,
  completed_count integer default 0,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_service_requirements_enrollment on service_requirements(enrollment_id);
create index if not exists idx_service_requirements_type on service_requirements(service_type);

-- Unique constraint: one requirement per service type per enrollment
create unique index if not exists idx_service_requirements_unique 
  on service_requirements(enrollment_id, service_type);

-- Enable Row Level Security (RLS) on all tables
alter table programs enable row level security;
alter table ai_instructors enable row level security;
alter table course_modules enable row level security;
alter table student_enrollments enable row level security;
alter table module_progress enable row level security;
alter table program_holders enable row level security;
alter table apprentice_hours_log enable row level security;
alter table service_requirements enable row level security;

-- Public read access for programs, modules, and AI instructors
create policy "Public can view active programs"
  on programs for select
  using (is_active = true);

create policy "Public can view course modules"
  on course_modules for select
  using (true);

create policy "Public can view AI instructors"
  on ai_instructors for select
  using (true);

-- Students can view their own enrollments and progress
create policy "Students can view own enrollments"
  on student_enrollments for select
  using (auth.uid() = student_id);

create policy "Students can view own module progress"
  on module_progress for select
  using (
    enrollment_id in (
      select id from student_enrollments where student_id = auth.uid()
    )
  );

create policy "Students can update own module progress"
  on module_progress for update
  using (
    enrollment_id in (
      select id from student_enrollments where student_id = auth.uid()
    )
  );

-- Program holders can view their apprentices
create policy "Program holders can view their apprentices"
  on student_enrollments for select
  using (
    program_id in (
      select program_id from program_holders 
      where email = (select email from auth.users where id = auth.uid())
    )
  );

create policy "Program holders can log hours"
  on apprentice_hours_log for insert
  with check (
    program_holder_id in (
      select id from program_holders 
      where email = (select email from auth.users where id = auth.uid())
    )
  );

-- Admin full access (assumes you have an admin role)
create policy "Admins have full access to programs"
  on programs for all
  using (
    exists (
      select 1 from auth.users 
      where id = auth.uid() 
      and raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comments for documentation
comment on table programs is 'All training programs (Barber, Healthcare, CDL, etc.)';
comment on table ai_instructors is 'AI instructor personas (Elizabeth, Marcus, Dr. Sarah, etc.)';
comment on table course_modules is 'Stacked credential modules (internal EFH + external partner)';
comment on table student_enrollments is 'Student enrollment records per program';
comment on table module_progress is 'Student progress through each module';
comment on table program_holders is 'Barbershop owners / program sponsors';
comment on table apprentice_hours_log is 'Daily hours and services log for apprentices';
comment on table service_requirements is 'State board service minimums tracking';
