-- Add tenant_id to workflows and workflow_runs for multi-tenant isolation.
-- Nullable so existing rows are unaffected. RLS policies can filter by tenant_id
-- once tenants are provisioned.

alter table public.workflows
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

alter table public.workflow_runs
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

alter table public.cron_job_runs
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

-- Indexes for tenant-scoped queries
create index if not exists workflows_tenant_id_idx
  on public.workflows (tenant_id) where tenant_id is not null;

create index if not exists workflow_runs_tenant_id_idx
  on public.workflow_runs (tenant_id, created_at desc) where tenant_id is not null;

create index if not exists cron_job_runs_tenant_id_idx
  on public.cron_job_runs (tenant_id, started_at desc) where tenant_id is not null;

-- Propagate tenant_id from workflow to run on insert (convenience trigger)
create or replace function public.propagate_workflow_tenant_id()
returns trigger language plpgsql security definer as $$
begin
  if NEW.tenant_id is null and NEW.workflow_id is not null then
    select tenant_id into NEW.tenant_id
    from public.workflows
    where id = NEW.workflow_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists workflow_runs_propagate_tenant on public.workflow_runs;
create trigger workflow_runs_propagate_tenant
  before insert on public.workflow_runs
  for each row execute function public.propagate_workflow_tenant_id();
