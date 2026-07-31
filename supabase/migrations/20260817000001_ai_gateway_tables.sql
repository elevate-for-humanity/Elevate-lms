-- Migration: 20260817_ai_gateway_tables.sql
-- AI Gateway Module - Database Schema
-- 
-- Tables for AI gateway logs, tasks, and events

begin;

-- ============================================================
-- AI GATEWAY LOGS
-- ============================================================
-- Records all AI gateway requests and responses for auditing

create table if not exists public.ai_gateway_logs (
  id uuid primary key default gen_random_uuid(),
  
  request_id uuid not null,
  
  agent_type text not null
    check (agent_type in ('PARS', 'ELLIE', 'LIZZY', 'ZORA', 'ROUTER')),
  
  intent text not null
    check (intent in (
      'ADMISSION', 
      'STUDENT_SUPPORT', 
      'ENROLLMENT', 
      'COURSE_BUILDER', 
      'COMPLIANCE', 
      'OPS', 
      'CAREER_PLACEMENT', 
      'GENERAL'
    )),
  
  message text not null,
  
  context jsonb default '{}'::jsonb,
  
  response jsonb,
  
  latency_ms integer,
  
  status text not null default 'success'
    check (status in ('success', 'failed', 'partial', 'timeout')),
  
  correlation_id text,
  
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists ai_gateway_logs_agent_type_idx 
  on public.ai_gateway_logs (agent_type);

create index if not exists ai_gateway_logs_intent_idx 
  on public.ai_gateway_logs (intent);

create index if not exists ai_gateway_logs_status_idx 
  on public.ai_gateway_logs (status);

create index if not exists ai_gateway_logs_created_at_idx 
  on public.ai_gateway_logs (created_at desc);

create index if not exists ai_gateway_logs_request_id_idx 
  on public.ai_gateway_logs (request_id);

create index if not exists ai_gateway_logs_correlation_id_idx 
  on public.ai_gateway_logs (correlation_id);

-- ============================================================
-- AI TASKS
-- ============================================================
-- Tracks all AI task execution with retry logic

create table if not exists public.ai_tasks (
  id uuid primary key default gen_random_uuid(),
  
  task_id text not null unique,
  
  agent_type text not null
    check (agent_type in ('PARS', 'ELLIE', 'LIZZY', 'ZORA', 'ROUTER')),
  
  intent text not null
    check (intent in (
      'ADMISSION', 
      'STUDENT_SUPPORT', 
      'ENROLLMENT', 
      'COURSE_BUILDER', 
      'COMPLIANCE', 
      'OPS', 
      'CAREER_PLACEMENT', 
      'GENERAL'
    )),
  
  payload jsonb not null default '{}'::jsonb,
  
  priority text not null default 'MEDIUM'
    check (priority in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  status text not null default 'QUEUED'
    check (status in ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PENDING_APPROVAL')),
  
  result jsonb,
  
  error text,
  
  attempts integer not null default 0,
  
  max_attempts integer not null default 3,
  
  timeout_ms integer not null default 300000,
  
  started_at timestamptz,
  
  completed_at timestamptz,
  
  correlation_id text,
  
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for task management
create index if not exists ai_tasks_task_id_idx 
  on public.ai_tasks (task_id);

create index if not exists ai_tasks_agent_type_idx 
  on public.ai_tasks (agent_type);

create index if not exists ai_tasks_intent_idx 
  on public.ai_tasks (intent);

create index if not exists ai_tasks_status_idx 
  on public.ai_tasks (status);

create index if not exists ai_tasks_priority_idx 
  on public.ai_tasks (priority);

create index if not exists ai_tasks_created_at_idx 
  on public.ai_tasks (created_at desc);

create index if not exists ai_tasks_correlation_id_idx 
  on public.ai_tasks (correlation_id);

-- Composite index for queue processing
create index if not exists ai_tasks_queue_idx 
  on public.ai_tasks (status, priority, created_at)
  where status = 'QUEUED';

-- ============================================================
-- AI EVENTS
-- ============================================================
-- Stores all AI system events for auditing and analytics

create table if not exists public.ai_events (
  id uuid primary key default gen_random_uuid(),
  
  event_type text not null
    check (event_type in (
      'APPLICATION_SUBMITTED',
      'INTERVIEW_STARTED',
      'INTERVIEW_COMPLETED',
      'ENROLLMENT_APPROVED',
      'ENROLLMENT_REJECTED',
      'COURSE_COMPLETED',
      'CERTIFICATE_ISSUED',
      'JOB_PLACED',
      'COMPLIANCE_ALERT',
      'TASK_ASSIGNED',
      'TASK_COMPLETED',
      'TASK_FAILED',
      'AGENT_STATUS_CHANGED',
      'GATEWAY_REQUEST',
      'GATEWAY_ERROR'
    )),
  
  source text not null,
  
  data jsonb not null default '{}'::jsonb,
  
  metadata jsonb default '{}'::jsonb,
  
  correlation_id text,
  
  created_at timestamptz not null default now()
);

-- Indexes for event queries
create index if not exists ai_events_event_type_idx 
  on public.ai_events (event_type);

create index if not exists ai_events_source_idx 
  on public.ai_events (source);

create index if not exists ai_events_created_at_idx 
  on public.ai_events (created_at desc);

create index if not exists ai_events_correlation_id_idx 
  on public.ai_events (correlation_id);

-- Composite index for event timeline
create index if not exists ai_events_type_time_idx 
  on public.ai_events (event_type, created_at desc);

-- ============================================================
-- AI AGENT STATUS
-- ============================================================
-- Tracks agent health and status over time

create table if not exists public.ai_agent_status (
  id uuid primary key default gen_random_uuid(),
  
  agent_type text not null
    check (agent_type in ('PARS', 'ELLIE', 'LIZZY', 'ZORA', 'ROUTER')),
  
  status text not null
    check (status in ('active', 'busy', 'offline')),
  
  load_percent numeric(5,2) not null default 0,
  
  active_tasks integer not null default 0,
  
  metadata jsonb default '{}'::jsonb,
  
  created_at timestamptz not null default now()
);

-- Index for agent status queries
create index if not exists ai_agent_status_agent_type_idx 
  on public.ai_agent_status (agent_type);

create index if not exists ai_agent_status_created_at_idx 
  on public.ai_agent_status (created_at desc);

create index if not exists ai_agent_status_agent_time_idx 
  on public.ai_agent_status (agent_type, created_at desc);

-- ============================================================
-- AI WEBHOOKS
-- ============================================================
-- Stores webhook configurations for event delivery

create table if not exists public.ai_webhooks (
  id uuid primary key default gen_random_uuid(),
  
  name text not null,
  
  url text not null,
  
  event_types text[] not null,
  
  secret text not null,
  
  enabled boolean not null default true,
  
  headers jsonb default '{}'::jsonb,
  
  metadata jsonb default '{}'::jsonb,
  
  created_by uuid,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for webhook queries
create index if not exists ai_webhooks_enabled_idx 
  on public.ai_webhooks (enabled);

create index if not exists ai_webhooks_event_types_idx 
  on public.ai_webhooks using gin (event_types);

-- ============================================================
-- AI WEBHOOK DELIVERIES
-- ============================================================
-- Tracks webhook delivery attempts and status

create table if not exists public.ai_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  
  webhook_id uuid not null references ai_webhooks(id) on delete cascade,
  
  event_id uuid not null references ai_events(id) on delete cascade,
  
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed')),
  
  attempts integer not null default 0,
  
  last_attempt timestamptz,
  
  response_status integer,
  
  response_body text,
  
  error text,
  
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Indexes for delivery tracking
create index if not exists ai_webhook_deliveries_webhook_id_idx 
  on public.ai_webhook_deliveries (webhook_id);

create index if not exists ai_webhook_deliveries_status_idx 
  on public.ai_webhook_deliveries (status);

create index if not exists ai_webhook_deliveries_created_at_idx 
  on public.ai_webhook_deliveries (created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.ai_gateway_logs enable row level security;
alter table public.ai_tasks enable row level security;
alter table public.ai_events enable row level security;
alter table public.ai_agent_status enable row level security;
alter table public.ai_webhooks enable row level security;
alter table public.ai_webhook_deliveries enable row level security;

-- Service role has full access for all tables
drop policy if exists "ai_gateway_logs service role full access" on public.ai_gateway_logs;
create policy "ai_gateway_logs service role full access"
  on public.ai_gateway_logs for all to service_role using (true) with check (true);

drop policy if exists "ai_tasks service role full access" on public.ai_tasks;
create policy "ai_tasks service role full access"
  on public.ai_tasks for all to service_role using (true) with check (true);

drop policy if exists "ai_events service role full access" on public.ai_events;
create policy "ai_events service role full access"
  on public.ai_events for all to service_role using (true) with check (true);

drop policy if exists "ai_agent_status service role full access" on public.ai_agent_status;
create policy "ai_agent_status service role full access"
  on public.ai_agent_status for all to service_role using (true) with check (true);

drop policy if exists "ai_webhooks service role full access" on public.ai_webhooks;
create policy "ai_webhooks service role full access"
  on public.ai_webhooks for all to service_role using (true) with check (true);

drop policy if exists "ai_webhook_deliveries service role full access" on public.ai_webhook_deliveries;
create policy "ai_webhook_deliveries service role full access"
  on public.ai_webhook_deliveries for all to service_role using (true) with check (true);

-- ============================================================
-- RETENTION POLICIES
-- ============================================================

-- Create function to clean old logs
create or replace function public.clean_ai_gateway_logs()
returns integer as $$
declare
  deleted_count integer;
begin
  delete from public.ai_gateway_logs 
  where created_at < now() - interval '90 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql security definer;

-- Create function to clean old events
create or replace function public.clean_ai_events()
returns integer as $$
declare
  deleted_count integer;
begin
  delete from public.ai_events 
  where created_at < now() - interval '90 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql security definer;

-- Create function to clean old agent status records
create or replace function public.clean_ai_agent_status()
returns integer as $$
declare
  deleted_count integer;
begin
  delete from public.ai_agent_status 
  where created_at < now() - interval '30 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql security definer;

-- Create function to clean old completed tasks
create or replace function public.clean_completed_ai_tasks()
returns integer as $$
declare
  deleted_count integer;
begin
  delete from public.ai_tasks 
  where status in ('COMPLETED', 'FAILED')
    and completed_at < now() - interval '30 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql security definer;

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Get task queue depth by priority
create or replace function public.get_ai_task_queue_depth()
returns table(priority text, count bigint) as $$
begin
  return query
  select t.priority, count(*)::bigint
  from public.ai_tasks t
  where t.status = 'QUEUED'
  group by t.priority
  order by 
    case t.priority 
      when 'CRITICAL' then 1 
      when 'HIGH' then 2 
      when 'MEDIUM' then 3 
      when 'LOW' then 4 
    end;
end;
$$ language plpgsql security definer;

-- Get agent performance metrics
create or replace function public.get_agent_metrics(
  agent_type_filter text default null,
  days_back integer default 7
)
returns table(
  agent_type text,
  total_tasks bigint,
  completed_tasks bigint,
  failed_tasks bigint,
  avg_latency_ms numeric,
  success_rate numeric
) as $$
begin
  return query
  select 
    t.agent_type,
    count(*)::bigint as total_tasks,
    count(*) filter (where t.status = 'COMPLETED')::bigint as completed_tasks,
    count(*) filter (where t.status = 'FAILED')::bigint as failed_tasks,
    avg(
      case 
        when t.completed_at is not null and t.started_at is not null 
        then extract(epoch from (t.completed_at - t.started_at)) * 1000 
      end
    )::numeric as avg_latency_ms,
    (
      count(*) filter (where t.status = 'COMPLETED')::numeric / 
      nullif(count(*)::numeric, 0)
    ) * 100 as success_rate
  from public.ai_tasks t
  where t.created_at >= now() - (days_back || ' days')::interval
    and (agent_type_filter is null or t.agent_type = agent_type_filter)
  group by t.agent_type;
end;
$$ language plpgsql security definer;

-- Log AI gateway request (helper function)
create or replace function public.log_ai_gateway_request(
  p_request_id uuid,
  p_agent_type text,
  p_intent text,
  p_message text,
  p_context jsonb default '{}'::jsonb,
  p_correlation_id text default null
)
returns uuid as $$
declare
  v_log_id uuid;
begin
  insert into public.ai_gateway_logs (
    request_id, agent_type, intent, message, context, correlation_id
  ) values (
    p_request_id, p_agent_type, p_intent, p_message, p_context, p_correlation_id
  ) returning id into v_log_id;
  
  return v_log_id;
end;
$$ language plpgsql security definer;

-- Update AI gateway log with response
create or replace function public.update_ai_gateway_log(
  p_log_id uuid,
  p_response jsonb,
  p_latency_ms integer,
  p_status text default 'success'
)
returns void as $$
begin
  update public.ai_gateway_logs
  set 
    response = p_response,
    latency_ms = p_latency_ms,
    status = p_status,
    updated_at = now()
  where id = p_log_id;
end;
$$ language plpgsql security definer;

-- Create AI event helper
create or replace function public.create_ai_event(
  p_event_type text,
  p_source text,
  p_data jsonb,
  p_metadata jsonb default '{}'::jsonb,
  p_correlation_id text default null
)
returns uuid as $$
declare
  v_event_id uuid;
begin
  insert into public.ai_events (
    event_type, source, data, metadata, correlation_id
  ) values (
    p_event_type, p_source, p_data, p_metadata, p_correlation_id
  ) returning id into v_event_id;
  
  return v_event_id;
end;
$$ language plpgsql security definer;

commit;
