alter table public.platform_events
  add column if not exists locked_at timestamptz;

create or replace function public.claim_platform_events_v1(p_limit integer default 20)
returns setof public.platform_events
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidates as (
    select pe.id
    from public.platform_events pe
    where (
      (pe.processing_status in ('pending','failed') and pe.available_at <= now())
      or (pe.processing_status = 'processing' and pe.locked_at < now() - interval '10 minutes')
    )
      and pe.attempts < 5
    order by pe.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit,20),100))
  ), claimed as (
    update public.platform_events pe
    set processing_status = 'processing',
        attempts = pe.attempts + 1,
        locked_at = now(),
        last_error = null
    from candidates c
    where pe.id = c.id
    returning pe.*
  )
  select * from claimed;
end;
$$;

revoke all on function public.claim_platform_events_v1(integer) from public;
grant execute on function public.claim_platform_events_v1(integer) to service_role;

create index if not exists platform_events_claim_idx
  on public.platform_events(processing_status, available_at, locked_at, attempts, created_at)
  where processing_status in ('pending','failed','processing');
