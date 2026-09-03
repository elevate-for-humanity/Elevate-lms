-- ai_operational_memory: persisted results from AI operational tasks.
-- Stores diagnostics, knowledge_graph_query, and deployment_analysis outputs
-- so they are queryable over time rather than ephemeral.
-- Scoped by task_type + context_key for deduplication.

create table if not exists public.ai_operational_memory (
  id           uuid        primary key default gen_random_uuid(),
  task_type    text        not null,   -- 'diagnostics' | 'knowledge_graph_query' | 'deployment_analysis'
  context_key  text        not null,   -- stable identifier for the query context (e.g. 'platform-health', 'workflow-engine')
  prompt       text,
  result       text        not null,
  provider     text,
  tokens_used  integer,
  tenant_id    uuid        references public.tenants(id) on delete set null,
  created_by   uuid        references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '90 days')
);

create index if not exists ai_operational_memory_task_type_idx
  on public.ai_operational_memory (task_type, created_at desc);

create index if not exists ai_operational_memory_context_key_idx
  on public.ai_operational_memory (context_key, created_at desc);

create index if not exists ai_operational_memory_expires_idx
  on public.ai_operational_memory (expires_at);

alter table public.ai_operational_memory enable row level security;

-- Only service role writes; admins can read via service role
create policy "service_role_all" on public.ai_operational_memory
  for all to service_role using (true) with check (true);

-- Extend the existing cleanup function to purge expired operational memory
create or replace function public.cleanup_expired_ai_memory()
returns integer language plpgsql security definer as $$
declare
  deleted_count integer := 0;
  conv_deleted  integer := 0;
  op_deleted    integer := 0;
begin
  delete from public.ai_conversation_memory where expires_at < now();
  get diagnostics conv_deleted = row_count;

  delete from public.ai_operational_memory where expires_at < now();
  get diagnostics op_deleted = row_count;

  deleted_count := conv_deleted + op_deleted;
  return deleted_count;
end;
$$;
