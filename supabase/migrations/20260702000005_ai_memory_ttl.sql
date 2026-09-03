-- ai_operator_memory TTL and archival
-- Adds expires_at column so entries can be given a lifetime.
-- Entries with no expires_at are kept forever (long-term memory).
-- A cleanup function deletes expired rows; called by the cron API route.

alter table public.ai_operator_memory
  add column if not exists expires_at timestamptz default null;

-- Index for efficient TTL cleanup queries
create index if not exists ai_operator_memory_expires_at_idx
  on public.ai_operator_memory(expires_at)
  where expires_at is not null;

-- Cleanup function: deletes expired entries, returns count removed
create or replace function public.cleanup_expired_ai_memory()
returns integer language plpgsql security definer as $$
declare
  deleted_count integer;
begin
  delete from public.ai_operator_memory
  where expires_at is not null and expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Set default TTL for transient memory types (30 days)
-- Long-term types (decision, architecture, note) keep expires_at = null
update public.ai_operator_memory
set expires_at = created_at + interval '30 days'
where memory_type in ('issue', 'deployment', 'audit', 'debug')
  and expires_at is null;
