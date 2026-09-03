-- Ellie action approval queue.
-- Every action Ellie proposes is staged here before execution.
-- Approved rows are executed by the /api/admin/ai-assistant/approve endpoint,
-- which writes the result to audit_logs and marks this row executed.

create table if not exists public.ellie_pending_actions (
  id            uuid primary key default gen_random_uuid(),
  action_type   text not null,
  label         text not null,
  params        jsonb not null default '{}',
  target_ids    uuid[] default '{}',          -- bulk targets (e.g. list of enrollment IDs)
  requested_by  uuid not null references auth.users(id) on delete cascade,
  session_id    text not null default 'default',
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected', 'executed', 'failed')),
  result        jsonb,                         -- populated after execution
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

-- Pending actions expire after 30 minutes to prevent stale approvals
create index if not exists ellie_pending_actions_user_status
  on public.ellie_pending_actions (requested_by, status, created_at desc);

-- RLS: admins can only see their own pending actions
alter table public.ellie_pending_actions enable row level security;

create policy "ellie_pending_actions_owner"
  on public.ellie_pending_actions
  for all
  using (requested_by = auth.uid());
