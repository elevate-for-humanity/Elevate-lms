-- Canonical persistent state for policy-controlled closed-loop automation.
-- One row per workflow + subject. The unique idempotency_key suppresses duplicate
-- side effects across retries/replays.

create table if not exists public.automation_followups (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null,
  subject_type text not null,
  subject_id uuid not null,
  trigger_type text not null,
  state text not null default 'open'
    check (state in ('open', 'waiting', 'resolved', 'escalated', 'failed')),
  detected_condition jsonb not null default '{}'::jsonb,
  proposed_action text,
  action_policy text
    check (action_policy is null or action_policy in ('AUTO', 'RULE_VERIFIED', 'APPROVAL', 'PROHIBITED_AUTONOMOUS')),
  execution_status text not null default 'pending'
    check (execution_status in ('pending', 'executing', 'executed', 'verified', 'suppressed', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  last_attempt_at timestamptz,
  next_check_at timestamptz,
  resolved_at timestamptz,
  escalation_status text not null default 'none'
    check (escalation_status in ('none', 'needed', 'created', 'closed')),
  failure_reason text,
  idempotency_key text not null,
  last_action_key text,
  audit_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_key, subject_type, subject_id),
  unique (idempotency_key)
);

create index if not exists automation_followups_due_idx
  on public.automation_followups (next_check_at)
  where state in ('open', 'waiting');

create index if not exists automation_followups_escalation_idx
  on public.automation_followups (escalation_status, updated_at desc)
  where escalation_status in ('needed', 'created');

alter table public.automation_followups enable row level security;

-- Operational rows are service-managed. Admins can inspect through server-side
-- service-role APIs; browsers do not receive direct table access.
revoke all on table public.automation_followups from anon, authenticated;

grant all on table public.automation_followups to service_role;

create or replace function public.set_automation_followups_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_automation_followups_updated_at on public.automation_followups;
create trigger trg_automation_followups_updated_at
before update on public.automation_followups
for each row execute function public.set_automation_followups_updated_at();
