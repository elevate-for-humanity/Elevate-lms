create table if not exists public.instructor_progress_reports (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles(id),
  student_id uuid not null references public.profiles(id),
  program_enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  program_id uuid references public.programs(id),
  report_date date not null default current_date,
  instructional_hours numeric(5,2) not null check (instructional_hours > 0 and instructional_hours <= 48),
  classroom_topics text not null check (length(trim(classroom_topics)) > 0),
  hands_on_activities text not null check (length(trim(hands_on_activities)) > 0),
  competencies_covered text[] not null default '{}',
  attendance_status text not null check (attendance_status in ('present', 'partial', 'excused_absence', 'unexcused_absence')),
  progress_status text not null check (progress_status in ('on_track', 'needs_support', 'completed')),
  ready_for_testing boolean not null default false,
  instructor_notes text,
  input_method text not null default 'manual' check (input_method in ('manual', 'voice', 'mixed')),
  created_at timestamptz not null default now()
);

create index if not exists instructor_progress_reports_student_date_idx
  on public.instructor_progress_reports(student_id, report_date desc);
create index if not exists instructor_progress_reports_instructor_date_idx
  on public.instructor_progress_reports(instructor_id, report_date desc);
create index if not exists instructor_progress_reports_enrollment_idx
  on public.instructor_progress_reports(program_enrollment_id, created_at desc);

alter table public.instructor_progress_reports enable row level security;

drop policy if exists instructor_progress_reports_read_own on public.instructor_progress_reports;
create policy instructor_progress_reports_read_own
  on public.instructor_progress_reports for select to authenticated
  using (instructor_id = auth.uid() or student_id = auth.uid());

drop policy if exists instructor_progress_reports_service_role on public.instructor_progress_reports;
create policy instructor_progress_reports_service_role
  on public.instructor_progress_reports for all to service_role
  using (true) with check (true);

comment on table public.instructor_progress_reports is
  'Append-only instructor progress forms documenting up to 48 hours of classroom and hands-on training, including testing-readiness attestation.';

create or replace function public.prevent_instructor_progress_report_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'instructor_progress_reports is append-only: % not allowed', tg_op;
end;
$$;

drop trigger if exists instructor_progress_reports_immutable_update on public.instructor_progress_reports;
create trigger instructor_progress_reports_immutable_update
  before update or delete on public.instructor_progress_reports
  for each row execute function public.prevent_instructor_progress_report_mutation();
