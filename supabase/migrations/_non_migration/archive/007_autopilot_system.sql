-- =============================================
-- AUTOPILOT TASK QUEUE SYSTEM
-- Complete implementation with DAG support
-- =============================================

-- Create automation schema
create schema if not exists automation;

-- Admin users who can approve/manage tasks
create table if not exists automation.admin_users (
  user_id uuid primary key,
  email text unique not null,
  added_at timestamptz default now()
);

-- Task types enum
create type automation.task_kind as enum (
  -- Infrastructure
  'db_migrate',
  'db_rls_fix',
  'redeploy',
  'cache_purge',
  
  -- Accessibility & Media
  'axe_a11y_scan',
  'caption_vod',
  'transcript_audio',
  
  -- Mobile
  'mobile_publish',
  
  -- Realtime & Collaboration
  'realtime_collab_boot',
  
  -- Internationalization
  'i18n_build',
  
  -- AI/ML Features
  'ai_features_boot',
  
  -- Communications & Auth
  'email_connect',
  'sms_connect',
  'oauth_connect',
  
  -- Payments
  'payments_expand',
  
  -- Security & Compliance
  'security_audit',
  'compliance_report',
  'gdpr_tools',
  'ferpa_tools',
  'soc2_prep'
);

-- Task status enum
create type automation.task_status as enum (
  'queued',
  'running',
  'needs_approval',
  'failed',
  'succeeded',
  'skipped'
);

-- Main tasks table
create table if not exists automation.tasks (
  id bigserial primary key,
  kind automation.task_kind not null,
  payload jsonb default '{}'::jsonb,
  priority int default 5,
  status automation.task_status default 'queued',
  error text,
  attempts int default 0,
  max_attempts int default 5,
  requires_approval boolean default false,
  approved_by uuid references automation.admin_users(user_id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Indexes for performance
create index if not exists idx_tasks_status on automation.tasks(status);
create index if not exists idx_tasks_kind on automation.tasks(kind);
create index if not exists idx_tasks_priority_created on automation.tasks(priority, created_at);
create index if not exists idx_tasks_updated on automation.tasks(updated_at desc);

-- Task dependencies (DAG support)
create table if not exists automation.task_edges (
  parent_id bigint references automation.tasks(id) on delete cascade,
  child_id bigint references automation.tasks(id) on delete cascade,
  primary key (parent_id, child_id)
);

create index if not exists idx_task_edges_parent on automation.task_edges(parent_id);
create index if not exists idx_task_edges_child on automation.task_edges(child_id);

-- Health log for monitoring
create table if not exists automation.health_log (
  id bigserial primary key,
  source text not null check (source in ('self-heal','autopilot','worker','manual')),
  kind text not null check (kind in ('site','db','deploy','migration','rollback')),
  status text not null check (status in ('ok','warn','error')),
  http_code int,
  detail text,
  task_id bigint references automation.tasks(id),
  at timestamptz not null default now()
);

create index if not exists idx_health_log_at on automation.health_log(at desc);
create index if not exists idx_health_log_status on automation.health_log(status);
create index if not exists idx_health_log_task on automation.health_log(task_id);

-- View: Children ready to run (all parents succeeded)
create or replace view automation.ready_children as
select c.child_id
from automation.task_edges c
left join automation.tasks p on p.id = c.parent_id
group by c.child_id
having bool_and(p.status = 'succeeded');

-- View: Health log rollup (last 7 days)
create or replace view automation.health_log_rollup as
select 
  date_trunc('hour', at) as hour,
  kind,
  status,
  count(*)::int as cnt
from automation.health_log
where at >= now() - interval '7 days'
group by 1, 2, 3
order by 1 desc;

-- View: Task statistics
create or replace view automation.task_stats as
select
  status,
  count(*)::int as count,
  avg(extract(epoch from (completed_at - started_at)))::int as avg_duration_seconds
from automation.tasks
where created_at >= now() - interval '7 days'
group by status;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

alter table automation.tasks enable row level security;
alter table automation.admin_users enable row level security;
alter table automation.health_log enable row level security;
alter table automation.task_edges enable row level security;

-- Admins can read tasks
create policy "admins_read_tasks" on automation.tasks
  for select to authenticated
  using (exists (
    select 1 from automation.admin_users a 
    where a.user_id = auth.uid()
  ));

-- Admins can update tasks
create policy "admins_update_tasks" on automation.tasks
  for update to authenticated
  using (exists (
    select 1 from automation.admin_users a 
    where a.user_id = auth.uid()
  ));

-- Service role can insert tasks (workers only)
revoke insert on automation.tasks from anon, authenticated;

-- Admins can read admin_users
create policy "admins_read_admin_users" on automation.admin_users
  for select to authenticated
  using (auth.uid() = user_id);

-- Admins can read health log
create policy "admins_read_health_log" on automation.health_log
  for select to authenticated
  using (exists (
    select 1 from automation.admin_users a 
    where a.user_id = auth.uid()
  ));

-- Admins can read task edges
create policy "admins_read_task_edges" on automation.task_edges
  for select to authenticated
  using (exists (
    select 1 from automation.admin_users a 
    where a.user_id = auth.uid()
  ));

-- =============================================
-- Helper Functions
-- =============================================

-- Function to update task timestamps
create or replace function automation.update_task_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  
  if new.status = 'running' and old.status != 'running' then
    new.started_at = now();
  end if;
  
  if new.status in ('succeeded', 'failed', 'skipped') and old.status not in ('succeeded', 'failed', 'skipped') then
    new.completed_at = now();
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update timestamps
drop trigger if exists update_task_timestamp on automation.tasks;
create trigger update_task_timestamp
  before update on automation.tasks
  for each row
  execute function automation.update_task_timestamp();

-- =============================================
-- Sample Data (Optional)
-- =============================================

-- Insert sample admin user (replace with your actual user_id)
-- insert into automation.admin_users (user_id, email) 
-- values ('00000000-0000-0000-0000-000000000000', 'admin@elevateforhumanity.org')
-- on conflict do nothing;

-- =============================================
-- Success Message
-- =============================================

do $$
begin
  raise notice '✅ Autopilot system schema created successfully!';
  raise notice '📋 Tables: tasks, task_edges, health_log, admin_users';
  raise notice '👁️ Views: ready_children, health_log_rollup, task_stats';
  raise notice '🔒 RLS policies enabled for all tables';
  raise notice '';
  raise notice '⚠️ NEXT STEPS:';
  raise notice '1. Add your user to automation.admin_users';
  raise notice '2. Deploy Supabase Edge Functions (autopilot-worker, autopilot-bridge)';
  raise notice '3. Set environment variables in Supabase Function settings';
  raise notice '4. Configure GitHub Actions workflow';
end $$;
