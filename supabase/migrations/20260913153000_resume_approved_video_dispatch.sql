-- Approving a media request atomically returns its existing job to the queue.
create or replace function public.approve_paid_inference_v1(
  p_request_id uuid,
  p_approved_by uuid
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_role text;
  v_request public.paid_inference_requests%rowtype;
begin
  select lower(coalesce(p.role::text, '')) into v_role
  from public.profiles p
  where p.id = p_approved_by;
  if v_role not in ('admin', 'super_admin', 'staff') then
    raise exception 'Paid inference approval requires an authorized administrator';
  end if;

  update public.paid_inference_requests
  set status='approved', approved_by=p_approved_by, approved_at=now(), updated_at=now()
  where id=p_request_id and status='approval_required'
  returning * into v_request;
  if not found then return false; end if;

  if v_request.job_id is not null and v_request.operation='lesson-video' then
    update public.video_jobs
    set status='queued', queued_at=now(), started_at=null, lease_token=null,
        lease_expires_at=null, heartbeat_at=null, error_message=null, updated_at=now()
    where id=v_request.job_id and status='draft' and retry_count < 3;

    update public.course_lessons l
    set video_status='queued', video_error=null, updated_at=now()
    from public.video_jobs j
    where j.id=v_request.job_id and l.id=j.lesson_id and j.status='queued';
  end if;
  return true;
end
$$;

revoke all on function public.approve_paid_inference_v1(uuid,uuid) from public,anon,authenticated;
grant execute on function public.approve_paid_inference_v1(uuid,uuid) to service_role;
