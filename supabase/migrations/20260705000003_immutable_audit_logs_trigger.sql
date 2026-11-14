-- Prevent UPDATE and DELETE on audit_logs to ensure append-only immutability.
-- Also prevents UPDATE/DELETE on workflow_runs once status = 'success' or 'failed'.

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
security definer
as $$
begin
  raise exception 'audit_logs rows are immutable — UPDATE and DELETE are not permitted';
end;
$$;

drop trigger if exists audit_logs_immutable on public.audit_logs;
create trigger audit_logs_immutable
  before update or delete on public.audit_logs
  for each row execute function public.prevent_audit_log_mutation();

-- workflow_runs: prevent mutation of terminal rows
create or replace function public.prevent_terminal_workflow_run_mutation()
returns trigger
language plpgsql
security definer
as $$
begin
  if OLD.status in ('success', 'failed', 'cancelled') then
    raise exception 'workflow_runs rows in terminal status (%) are immutable', OLD.status;
  end if;
  return new;
end;
$$;

drop trigger if exists workflow_runs_terminal_immutable on public.workflow_runs;
create trigger workflow_runs_terminal_immutable
  before update on public.workflow_runs
  for each row execute function public.prevent_terminal_workflow_run_mutation();
