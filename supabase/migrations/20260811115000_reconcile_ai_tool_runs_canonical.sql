-- Reconcile environments where an earlier ai_tool_runs shape already exists.
-- The canonical executor records HTTP-backed tool executions and explicit approvals.

alter table public.ai_tool_runs add column if not exists actor_role text;
alter table public.ai_tool_runs add column if not exists agent_id text;
alter table public.ai_tool_runs add column if not exists classification text;
alter table public.ai_tool_runs add column if not exists approval_required boolean not null default false;
alter table public.ai_tool_runs add column if not exists correlation_id text;

update public.ai_tool_runs
set agent_id = coalesce(agent_id, 'ROUTER')
where agent_id is null;

update public.ai_tool_runs
set classification = coalesce(
  classification,
  case when coalesce(requires_approval, false) then 'write' else 'read' end
)
where classification is null;

update public.ai_tool_runs
set approval_required = coalesce(approval_required, requires_approval, false);

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.ai_tool_runs'::regclass
      and contype = 'c'
  loop
    execute format('alter table public.ai_tool_runs drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.ai_tool_runs alter column agent_id set not null;
alter table public.ai_tool_runs alter column classification set not null;

alter table public.ai_tool_runs
  add constraint ai_tool_runs_classification_check
  check (classification in ('read', 'write'));

alter table public.ai_tool_runs
  add constraint ai_tool_runs_risk_level_check
  check (risk_level in ('low', 'medium', 'high', 'critical'));

alter table public.ai_tool_runs
  add constraint ai_tool_runs_approval_status_check
  check (approval_status in ('not_required', 'pending', 'approved', 'denied', 'rejected'));

alter table public.ai_tool_runs
  add constraint ai_tool_runs_status_check
  check (status in ('queued', 'running', 'pending_approval', 'started', 'approval_required', 'completed', 'failed', 'blocked'));

create index if not exists ai_tool_runs_agent_idx
  on public.ai_tool_runs(agent_id, created_at desc);
create index if not exists ai_tool_runs_tool_idx
  on public.ai_tool_runs(tool_name, created_at desc);
create index if not exists ai_tool_runs_correlation_idx
  on public.ai_tool_runs(correlation_id);
