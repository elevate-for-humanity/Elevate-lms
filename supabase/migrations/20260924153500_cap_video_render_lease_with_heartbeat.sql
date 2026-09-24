-- Healthy canonical video workers renew their lease every minute. Cap each
-- rendering lease at ten minutes so a dead worker cannot block the global
-- renderer queue for the previous one-hour lease window. The lease token
-- remains the ownership authority; a live worker keeps extending this bounded
-- deadline through heartbeat_video_job().

create or replace function public.cap_video_job_render_lease()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'rendering' and new.lease_expires_at is not null then
    new.lease_expires_at := least(
      new.lease_expires_at,
      now() + interval '10 minutes'
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.cap_video_job_render_lease()
  from public, anon, authenticated;
grant execute on function public.cap_video_job_render_lease() to service_role;

drop trigger if exists cap_video_job_render_lease on public.video_jobs;
create trigger cap_video_job_render_lease
before insert or update of status, lease_expires_at, heartbeat_at
on public.video_jobs
for each row
execute function public.cap_video_job_render_lease();

comment on function public.cap_video_job_render_lease() is
  'Caps rendering leases at ten minutes. Healthy workers renew every minute; orphaned jobs release capacity promptly instead of blocking the canonical queue for an hour.';
