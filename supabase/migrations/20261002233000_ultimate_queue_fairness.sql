-- Honor the durable lesson cursor and yield time so one course cannot starve others.
create or replace function public.claim_ultimate_build_job(p_worker text, p_lease_seconds integer default 300)
returns setof public.ultimate_build_jobs
language plpgsql security definer
set search_path = ''
as $function$
declare v_id uuid;
begin
  if nullif(btrim(p_worker), '') is null or p_lease_seconds not between 30 and 900 then
    raise exception 'invalid worker lease request';
  end if;

  update public.ultimate_build_jobs
  set status = 'queued', lease_owner = null, lease_expires_at = null, updated_at = now()
  where status = 'running' and lease_expires_at < now() and attempts < max_attempts;

  update public.ultimate_build_jobs
  set status = 'failed', last_error = coalesce(last_error, 'lease expired after retry limit'), updated_at = now()
  where status = 'running' and lease_expires_at < now() and attempts >= max_attempts;

  select j.id into v_id
  from public.ultimate_build_jobs j
  join public.ultimate_course_builds b on b.id = j.build_id
  join public.courses c on c.id = b.course_id
  where j.status = 'queued'
    and j.available_at <= now()
    and j.attempts < j.max_attempts
    and c.status <> 'archived'::public.course_status
  order by j.available_at asc, j.priority asc, j.created_at asc
  for update of j skip locked
  limit 1;

  if v_id is null then return; end if;

  return query
  update public.ultimate_build_jobs j
  set status = 'running', attempts = j.attempts + 1, lease_owner = p_worker,
      heartbeat_at = now(), lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      updated_at = now()
  where j.id = v_id
  returning j.*;
end
$function$;
revoke all on function public.claim_ultimate_build_job(text, integer) from public, anon, authenticated;
grant execute on function public.claim_ultimate_build_job(text, integer) to service_role;
