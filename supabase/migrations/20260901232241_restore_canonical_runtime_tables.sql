begin;

set local lock_timeout='5s';

set local statement_timeout='10min';

CREATE TABLE IF NOT EXISTS public.ai_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'career_guidance',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_step TEXT DEFAULT 'greeting',
  session_data JSONB DEFAULT '{}',
  recommended_programs TEXT[],
  assessment_score INTEGER,
  assessment_notes TEXT,
  next_steps TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.calculator_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    calculator_type TEXT NOT NULL,
    inputs JSONB,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cmi_enrollments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES public.programs(id) ON DELETE SET NULL,
  course_id       UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  enrolled_by     UUID        REFERENCES public.profiles(id),
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'withdrawn')),
  completion_pct  NUMERIC(5,2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cmi_outcomes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  enrollment_id   UUID        REFERENCES public.cmi_enrollments(id) ON DELETE SET NULL,
  outcome_type    TEXT        NOT NULL,
  outcome_value   TEXT,
  credential_id   UUID,
  issued_at       TIMESTAMPTZ,
  placed_job      BOOLEAN,
  job_title       TEXT,
  employer        TEXT,
  wages           NUMERIC(10,2),
  placed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cmi_progress (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  total_lessons   INTEGER     DEFAULT 0,
  completed_lessons INTEGER   DEFAULT 0,
  total_modules   INTEGER     DEFAULT 0,
  completed_modules INTEGER    DEFAULT 0,
  overall_pct     NUMERIC(5,2) DEFAULT 0,
  total_seat_time INTEGER     DEFAULT 0,
  last_activity   TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id)
);

CREATE TABLE IF NOT EXISTS public.cmi_quiz_scores (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  lesson_id       UUID        REFERENCES public.training_lessons(id) ON DELETE SET NULL,
  quiz_id         UUID,
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  score_raw       NUMERIC(5,2),
  score_pct       NUMERIC(5,2),
  passing_score   NUMERIC(5,2) DEFAULT 70,
  passed          BOOLEAN,
  max_score       NUMERIC(5,2),
  time_spent_secs INTEGER,
  taken_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cmi_seat_time (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID        NOT NULL REFERENCES public.cmi_enrollments(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES public.cmi_students(id) ON DELETE CASCADE,
  lesson_id       UUID        REFERENCES public.training_lessons(id) ON DELETE SET NULL,
  date            DATE        NOT NULL,
  seconds_spent   INTEGER     NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_course_updates BOOLEAN DEFAULT true,
  email_grades BOOLEAN DEFAULT true,
  email_deadlines BOOLEAN DEFAULT true,
  email_messages BOOLEAN DEFAULT true,
  email_newsletter BOOLEAN DEFAULT true,
  push_messages BOOLEAN DEFAULT true,
  push_reminders BOOLEAN DEFAULT true,
  push_announcements BOOLEAN DEFAULT true,
  sms_urgent BOOLEAN DEFAULT false,
  sms_reminders BOOLEAN DEFAULT false,
  sms_phone TEXT,
  in_app_all BOOLEAN DEFAULT true,
  in_app_sound BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

create table if not exists public.platform_jobs (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null,

  job_type text not null
    check (job_type in (
      'deployment',
      'container',
      'cfd_simulation',
      'evaluation',
      'content_generation',
      'backup',
      'sync',
      'cleanup',
      'custom'
    )),

  status text not null default 'queued'
    check (status in (
      'draft',
      'queued',
      'running',
      'verifying',
      'succeeded',
      'failed',
      'cancelled'
    )),

  priority integer not null default 5
    check (priority between 1 and 10),

  payload jsonb not null default '{}'::jsonb,

  result jsonb,

  error_message text,

  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_job_events (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null references platform_jobs(id) on delete cascade,

  event_type text not null
    check (event_type in (
      'created',
      'queued',
      'started',
      'progress',
      'log',
      'completed',
      'failed',
      'cancelled',
      'retry'
    )),

  message text,
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.student_binder_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('application', 'enrollment_agreement', 'id_document', 'funding_documents', 'attendance', 'progress_reports', 'certificates', 'testing_scores', 'apprenticeship_docs', 'case_notes', 'other')),
  title TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'uploaded', 'approved', 'rejected')),
  uploaded_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, title)
);

create table if not exists public.studio_events (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null,
  user_id uuid not null,

  event_type text not null,

  workspace_id text,

  metadata jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

alter table public.notification_preferences
  add column if not exists push_enabled boolean default true,
  add column if not exists opted_in_at timestamptz;

alter table public.calculator_usage
  add column if not exists program_slug text,
  add column if not exists current_wage numeric,
  add column if not exists employment_status text,
  add column if not exists calculated_at timestamptz default now();

alter table public."ai_interview_sessions" enable row level security;

revoke all on table public."ai_interview_sessions" from anon, authenticated;

grant select, insert, update, delete on table public."ai_interview_sessions" to authenticated;

alter table public."calculator_usage" enable row level security;

revoke all on table public."calculator_usage" from anon, authenticated;

grant select, insert, update, delete on table public."calculator_usage" to authenticated;

alter table public."cmi_enrollments" enable row level security;

revoke all on table public."cmi_enrollments" from anon, authenticated;

grant select, insert, update, delete on table public."cmi_enrollments" to authenticated;

alter table public."cmi_outcomes" enable row level security;

revoke all on table public."cmi_outcomes" from anon, authenticated;

grant select, insert, update, delete on table public."cmi_outcomes" to authenticated;

alter table public."cmi_progress" enable row level security;

revoke all on table public."cmi_progress" from anon, authenticated;

grant select, insert, update, delete on table public."cmi_progress" to authenticated;

alter table public."cmi_quiz_scores" enable row level security;

revoke all on table public."cmi_quiz_scores" from anon, authenticated;

grant select, insert, update, delete on table public."cmi_quiz_scores" to authenticated;

alter table public."cmi_seat_time" enable row level security;

revoke all on table public."cmi_seat_time" from anon, authenticated;

grant select, insert, update, delete on table public."cmi_seat_time" to authenticated;

alter table public."notification_preferences" enable row level security;

revoke all on table public."notification_preferences" from anon, authenticated;

grant select, insert, update, delete on table public."notification_preferences" to authenticated;

alter table public."platform_job_events" enable row level security;

revoke all on table public."platform_job_events" from anon, authenticated;

grant select, insert, update, delete on table public."platform_job_events" to authenticated;

alter table public."platform_jobs" enable row level security;

revoke all on table public."platform_jobs" from anon, authenticated;

grant select, insert, update, delete on table public."platform_jobs" to authenticated;

alter table public."student_binder_documents" enable row level security;

revoke all on table public."student_binder_documents" from anon, authenticated;

grant select, insert, update, delete on table public."student_binder_documents" to authenticated;

alter table public."studio_events" enable row level security;

revoke all on table public."studio_events" from anon, authenticated;

grant select, insert, update, delete on table public."studio_events" to authenticated;

drop policy if exists "ai_interview_sessions_owner_access" on public."ai_interview_sessions";

create policy "ai_interview_sessions_owner_access" on public."ai_interview_sessions" for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "notification_preferences_owner_access" on public."notification_preferences";

create policy "notification_preferences_owner_access" on public."notification_preferences" for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "calculator_usage_owner_access" on public."calculator_usage";

create policy "calculator_usage_owner_access" on public."calculator_usage" for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "studio_events_owner_or_admin" on public.studio_events;

create policy "studio_events_owner_or_admin" on public.studio_events for all to authenticated
using ((select auth.uid()) = user_id or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff')))
with check ((select auth.uid()) = user_id or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff')));

drop policy if exists "student_binder_owner_or_admin" on public.student_binder_documents;

create policy "student_binder_owner_or_admin" on public.student_binder_documents for all to authenticated
using ((select auth.uid()) = student_id or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff')))
with check ((select auth.uid()) = student_id or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff')));

drop policy if exists "cmi_enrollments_operator_access" on public."cmi_enrollments";

create policy "cmi_enrollments_operator_access" on public."cmi_enrollments" for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')));

drop policy if exists "cmi_quiz_scores_operator_access" on public."cmi_quiz_scores";

create policy "cmi_quiz_scores_operator_access" on public."cmi_quiz_scores" for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')));

drop policy if exists "cmi_seat_time_operator_access" on public."cmi_seat_time";

create policy "cmi_seat_time_operator_access" on public."cmi_seat_time" for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')));

drop policy if exists "cmi_progress_operator_access" on public."cmi_progress";

create policy "cmi_progress_operator_access" on public."cmi_progress" for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')));

drop policy if exists "cmi_outcomes_operator_access" on public."cmi_outcomes";

create policy "cmi_outcomes_operator_access" on public."cmi_outcomes" for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')));

drop policy if exists "platform_jobs_operator_access" on public."platform_jobs";

create policy "platform_jobs_operator_access" on public."platform_jobs" for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')));

drop policy if exists "platform_job_events_operator_access" on public."platform_job_events";

create policy "platform_job_events_operator_access" on public."platform_job_events" for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')));

notify pgrst, 'reload schema';

commit;