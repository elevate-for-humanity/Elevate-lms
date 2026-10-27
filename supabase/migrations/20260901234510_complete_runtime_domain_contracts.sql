begin;
set local lock_timeout='5s';
set local statement_timeout='10min';

alter table public.applications
  add column if not exists interview_started_at timestamptz,
  add column if not exists interview_completed boolean not null default false,
  add column if not exists interview_completed_at timestamptz,
  add column if not exists interview_current_question integer not null default 0,
  add column if not exists interview_responses jsonb not null default '{}'::jsonb,
  add column if not exists interview_score numeric,
  add column if not exists risk_level text,
  add column if not exists funding_tier text,
  add column if not exists funding_percentage numeric,
  add column if not exists program_name text;

alter table public.employees
  add column if not exists pay_type text,
  add column if not exists effective_date date;

alter table public.program_holders
  add column if not exists rejection_reason text,
  add column if not exists reviewed_at timestamptz;

create table if not exists public.onboarding_video_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_key text not null,
  watch_seconds numeric not null default 0,
  duration_seconds numeric not null default 0,
  completion_percentage numeric not null default 0,
  status text not null default 'assigned',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, video_key)
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.apprentice_notifications (
  id uuid primary key default gen_random_uuid(),
  apprenticeship_id uuid,
  student_id uuid,
  notification_type text not null,
  scheduled_time text,
  days_of_week text[],
  enabled boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default 'null'::jsonb,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_sync_log (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  action text not null,
  records jsonb not null default '[]'::jsonb,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_tasks (
  id uuid primary key default gen_random_uuid(),
  studio_type text not null,
  task_type text not null,
  name text not null,
  description text,
  input_data jsonb not null default '{}'::jsonb,
  output_data jsonb,
  status text not null default 'queued',
  evidence jsonb,
  confidence_score numeric,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gap_draft_jobs (
  id uuid primary key default gen_random_uuid(),
  gap_type text not null,
  target_id uuid,
  target_title text,
  severity text,
  description text,
  recommendation text,
  status text not null default 'draft',
  priority integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  status text not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(enrollment_id)
);

create table if not exists public.student_dashboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  display_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, enrollment_id)
);

create table if not exists public.program_holder_notices (
  id uuid primary key default gen_random_uuid(),
  program_holder_id uuid not null references public.program_holders(id) on delete cascade,
  type text not null,
  policy_id uuid,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluation_tasks (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  version integer not null default 1,
  updatedat timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.evaluation_workflow_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.evaluation_tasks(id) on delete cascade,
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  createdat timestamptz not null default now()
);
create table if not exists public.evaluation_version_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.evaluation_tasks(id) on delete cascade,
  version integer,
  author text,
  authorid uuid,
  payload jsonb not null default '{}'::jsonb,
  createdat timestamptz not null default now()
);

create table if not exists public.user_completion_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checklist_item_id uuid not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, checklist_item_id)
);

create table if not exists public.skill_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  skill_id uuid,
  status text not null default 'pending',
  verified_at timestamptz,
  instructor_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_recipients (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  read boolean not null default false,
  read_at timestamptz,
  email_sent boolean not null default false,
  sms_sent boolean not null default false,
  created_at timestamptz not null default now(),
  unique(announcement_id, user_id)
);

create table if not exists public.workforce_scan_history (
  id uuid primary key default gen_random_uuid(),
  scanned_at timestamptz not null default now(),
  total_occupations integer not null default 0,
  new_opportunities integer not null default 0,
  high_priority_opportunities integer not null default 0,
  results jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.onboarding_video_assignments enable row level security;
alter table public.timeline_events enable row level security;
alter table public.apprentice_notifications enable row level security;
alter table public.system_settings enable row level security;
alter table public.integration_sync_log enable row level security;
alter table public.studio_tasks enable row level security;
alter table public.gap_draft_jobs enable row level security;
alter table public.onboarding_plans enable row level security;
alter table public.student_dashboards enable row level security;
alter table public.program_holder_notices enable row level security;
alter table public.evaluation_tasks enable row level security;
alter table public.evaluation_workflow_history enable row level security;
alter table public.evaluation_version_history enable row level security;
alter table public.user_completion_status enable row level security;
alter table public.skill_verifications enable row level security;
alter table public.announcement_recipients enable row level security;
alter table public.workforce_scan_history enable row level security;

do $$
declare t text;
begin
  foreach t in array array['timeline_events','apprentice_notifications','system_settings','integration_sync_log','studio_tasks','gap_draft_jobs','program_holder_notices','evaluation_tasks','evaluation_workflow_history','evaluation_version_history','workforce_scan_history']
  loop
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I',t||'_operator_access',t);
    execute format($p$create policy %I on public.%I for all to authenticated
      using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))
      with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin','advisor','staff','instructor')))$p$,t||'_operator_access',t);
  end loop;
end $$;

grant select,insert,update,delete on public.onboarding_video_assignments, public.onboarding_plans, public.student_dashboards, public.user_completion_status, public.skill_verifications, public.announcement_recipients to authenticated;

create policy onboarding_video_assignments_owner on public.onboarding_video_assignments for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy onboarding_plans_owner on public.onboarding_plans for all to authenticated using ((select auth.uid())=student_id) with check ((select auth.uid())=student_id);
create policy student_dashboards_owner on public.student_dashboards for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy user_completion_status_owner on public.user_completion_status for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy skill_verifications_owner on public.skill_verifications for select to authenticated using ((select auth.uid())=user_id or (select auth.uid())=instructor_id);
create policy announcement_recipients_owner on public.announcement_recipients for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

notify pgrst,'reload schema';
commit;