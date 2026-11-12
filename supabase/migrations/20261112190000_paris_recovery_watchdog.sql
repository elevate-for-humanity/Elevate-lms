set lock_timeout='2s';
set statement_timeout='90s';

-- PARIS monitor heartbeat: written by each signed repair tick.
alter table public.paris_autopilot_policy add column if not exists last_tick_at timestamptz;

-- Studio FK covering indexes ship in 20261112130000_paris_studio_fk_indexes.sql.

-- Requeue blocked repairs whose root cause is fixed, selected by exact error
-- code. attempt_count is preserved: the attempt bound is deliberate and the
-- dispatch preflight still enforces it. Diagnose first:
--   select error_code, count(*) from public.paris_code_repairs
--   where status = 'blocked' group by error_code order by 2 desc;
-- Replaces the integer-returning version from 20261112130000 (return types
-- cannot change in place) and keeps its in-progress guard.
drop function if exists public.requeue_fixed_paris_repairs(text[]);
create function public.requeue_fixed_paris_repairs(p_error_codes text[])
returns table (repair_id uuid, error_code text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_error_codes is null or cardinality(p_error_codes) = 0 then
    raise exception 'PARIS_REQUEUE_ERROR_CODES_REQUIRED' using errcode = '22023';
  end if;
  lock table public.paris_code_repairs in share row exclusive mode;
  if exists (select 1 from public.paris_code_repairs
             where status in ('dispatched','patching','validating','deploying','verifying')) then
    raise exception 'PARIS_REPAIR_IN_PROGRESS' using errcode = '55000';
  end if;
  return query
  update public.paris_code_repairs r
     set status = 'queued',
         error_code = null,
         attempt_history = coalesce(r.attempt_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
           'error', r.error_code, 'at', r.updated_at, 'retryReason', 'operator-fixed-error-code')),
         updated_at = now()
   where r.status = 'blocked'
     and r.error_code = any (p_error_codes)
  returning r.id, (r.attempt_history -> -1 ->> 'error');
end;
$$;

revoke all on function public.requeue_fixed_paris_repairs(text[]) from public, anon, authenticated;
grant execute on function public.requeue_fixed_paris_repairs(text[]) to service_role;
