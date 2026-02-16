-- External Partner Modules Migration
-- Allows partners to be embedded as course modules with link-based or API-based delivery

-- 1. Status enum for progress
do $$ begin
  if not exists (select 1 from pg_type where typname = 'external_module_status') then
    create type external_module_status as enum (
      'not_started',
      'in_progress',
      'submitted',
      'approved'
    );
  end if;
end $$;

-- 2. Delivery mode enum (API or link-based)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'partner_delivery_mode') then
    create type partner_delivery_mode as enum (
      'api',        -- Full API integration (HSI, Certiport, etc.)
      'link',       -- Link-based with proof upload (Milady, etc.)
      'hybrid'      -- Both API and link support
    );
  end if;
end $$;

-- 3. External partner module definition
create table if not exists public.external_partner_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  partner_name text not null,           -- e.g. 'Milady RISE', 'HSI', 'Certiport'
  partner_type text,                    -- 'milady', 'hsi', 'certiport', etc. (matches lib/partners)
  delivery_mode partner_delivery_mode not null default 'link',
  launch_url text not null,             -- their link (always provided)
  external_course_code text,            -- for API-based enrollments
  description text,
  hours numeric,
  requires_proof boolean default true,  -- true for link-based, false for API-based
  is_required boolean default true,     -- required for course completion
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Student progress for each external module
create table if not exists public.external_partner_progress (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.external_partner_modules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status external_module_status not null default 'not_started',
  
  -- Link-based fields
  proof_file_url text,
  notes text,
  
  -- API-based fields
  external_enrollment_id text,          -- from partner API
  external_account_id text,             -- from partner API
  progress_percentage integer default 0,
  completed_at timestamptz,
  certificate_url text,
  certificate_number text,
  
  -- Approval tracking
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (module_id, user_id)
);

-- 5. Indexes for performance
create index if not exists idx_external_modules_course 
  on public.external_partner_modules(course_id);

create index if not exists idx_external_modules_partner 
  on public.external_partner_modules(partner_type);

create index if not exists idx_external_progress_module 
  on public.external_partner_progress(module_id);

create index if not exists idx_external_progress_user 
  on public.external_partner_progress(user_id);

create index if not exists idx_external_progress_status 
  on public.external_partner_progress(status);

-- 6. RLS policies
alter table public.external_partner_modules enable row level security;
alter table public.external_partner_progress enable row level security;

-- Students can view modules in their enrolled courses
create policy "students_can_view_course_modules"
on public.external_partner_modules
for select
using (
  exists (
    select 1 from public.enrollments
    where enrollments.course_id = external_partner_modules.course_id
    and enrollments.user_id = auth.uid()
  )
);

-- Admins can manage all modules
create policy "admins_can_manage_modules"
on public.external_partner_modules
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'instructor')
  )
);

-- Students can manage their own progress
create policy "students_can_manage_own_progress"
on public.external_partner_progress
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Admins can view and approve all progress
create policy "admins_can_manage_all_progress"
on public.external_partner_progress
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'instructor')
  )
);

-- 7. Function to auto-approve API-based completions
create or replace function auto_approve_api_completion()
returns trigger as $$
begin
  -- If this is an API-based module and progress reaches 100%, auto-approve
  if new.progress_percentage = 100 and new.status = 'in_progress' then
    new.status := 'approved';
    new.approved_at := now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_auto_approve_api_completion
  before update on public.external_partner_progress
  for each row
  execute function auto_approve_api_completion();

-- 8. Function to check course completion including external modules
create or replace function check_course_completion_with_external(
  p_user_id uuid,
  p_course_id uuid
)
returns boolean as $$
declare
  v_required_modules_count integer;
  v_completed_modules_count integer;
begin
  -- Count required external modules
  select count(*)
  into v_required_modules_count
  from public.external_partner_modules
  where course_id = p_course_id
  and is_required = true;
  
  -- Count completed/approved external modules
  select count(*)
  into v_completed_modules_count
  from public.external_partner_progress ep
  join public.external_partner_modules em on em.id = ep.module_id
  where em.course_id = p_course_id
  and em.is_required = true
  and ep.user_id = p_user_id
  and ep.status = 'approved';
  
  -- Return true if all required modules are completed
  return v_completed_modules_count >= v_required_modules_count;
end;
$$ language plpgsql;

-- 9. Add comment documentation
comment on table public.external_partner_modules is 
  'Partner courses embedded as modules within Elevate courses. Supports both API-based and link-based delivery.';

comment on table public.external_partner_progress is 
  'Student progress tracking for external partner modules. Handles both API sync and manual proof upload.';

comment on column public.external_partner_modules.delivery_mode is 
  'api: Full API integration with auto-sync. link: Link-based with proof upload. hybrid: Both supported.';

comment on column public.external_partner_progress.status is 
  'not_started: Not yet accessed. in_progress: Student working on it. submitted: Proof uploaded (link mode). approved: Completed and verified.';
