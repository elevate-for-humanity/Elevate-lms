create schema if not exists private;

create or replace function private.wake_course_video_worker()
returns bigint
language sql
security invoker
set search_path = private, public, net, pg_temp
as $$
  select net.http_post(
    url := 'https://admin.elevateforhumanity.org/api/internal/videos/process-queue',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || public.get_platform_secret('CRON_SECRET'),
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 60000
  );
$$;

revoke all on function private.wake_course_video_worker() from public, anon, authenticated;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'course-video-worker-every-minute'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'course-video-worker-every-minute',
    '* * * * *',
    'select private.wake_course_video_worker();'
  );
end;
$$;