-- program_instructors: assigns human instructors to programs.
--
-- Used by the instructor dashboard to scope enrollment views.
-- Until this table is populated, instructors see all program_enrollments.
--
-- Apply in Supabase Dashboard → SQL Editor, then populate rows for each
-- instructor/program pair before enabling scoped filtering in the dashboard.

create table if not exists public.program_instructors (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  program_id    uuid not null references public.programs(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  assigned_by   uuid references public.profiles(id) on delete set null,
  is_primary    boolean not null default false,

  unique (instructor_id, program_id)
);

create index if not exists idx_program_instructors_instructor
  on public.program_instructors(instructor_id);

create index if not exists idx_program_instructors_program
  on public.program_instructors(program_id);

-- RLS: admins and staff can manage; instructors can read their own rows
alter table public.program_instructors enable row level security;

create policy "Admins manage program_instructors"
  on public.program_instructors
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

create policy "Instructors read own assignments"
  on public.program_instructors
  for select
  using (instructor_id = auth.uid());
