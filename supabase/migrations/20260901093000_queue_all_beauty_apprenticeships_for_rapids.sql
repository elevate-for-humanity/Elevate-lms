-- Every new beauty apprenticeship enters the same auditable RAPIDS work queue.
-- The queue is the handoff for sponsor-reviewed bulk import/API submission; it
-- does not claim that DOL accepted a record before a RAPIDS identifier returns.

create or replace function public.enqueue_active_apprentice_for_rapids()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  occupation_code text;
  queue_status text := 'pending';
  display_occupation text;
begin
  if new.program_slug not in (
    'barber-apprenticeship',
    'cosmetology-apprenticeship',
    'esthetician-apprenticeship',
    'nail-technician-apprenticeship'
  ) or new.status <> 'active' or (tg_op = 'UPDATE' and coalesce(old.status,'') = 'active') then
    return new;
  end if;

  case new.program_slug
    when 'barber-apprenticeship' then occupation_code := '0030CB'; display_occupation := 'Barber';
    when 'esthetician-apprenticeship' then occupation_code := '2089CB'; display_occupation := 'Esthetician';
    when 'nail-technician-apprenticeship' then occupation_code := '2090CB'; display_occupation := 'Manicurist';
    when 'cosmetology-apprenticeship' then
      -- The repository contains operational cosmetology materials but its
      -- canonical approved Appendix A version is not loaded. Queue the record
      -- without inventing a registered occupation code.
      occupation_code := null;
      display_occupation := 'Cosmetologist';
      queue_status := 'blocked';
  end case;

  insert into public.rapids_action_queue(entity_type,entity_id,action_type,status,payload)
  values(
    'apprentice',new.id,'register_apprentice',queue_status,
    jsonb_build_object(
      'enrollment_id',new.id,
      'student_id',coalesce(new.user_id,new.student_id),
      'program_slug',new.program_slug,
      'occupation_title',display_occupation,
      'occupation_code',occupation_code,
      'full_name',new.full_name,
      'email',new.email,
      'host_shop_id',new.host_shop_id,
      'blocked_reason',case when occupation_code is null then 'APPROVED_APPENDIX_A_VERSION_REQUIRED' else null end
    )
  )
  on conflict(entity_type,entity_id,action_type) do update
    set payload=excluded.payload,status=excluded.status,updated_at=now(),completed_at=null;

  insert into public.staff_notifications(type,title,message,severity,metadata)
  values(
    'apprentice_ready_for_rapids',
    case when queue_status='pending' then 'Apprentice ready for RAPIDS' else 'RAPIDS registration needs standard configuration' end,
    coalesce(new.full_name,new.email,display_occupation || ' apprentice') ||
      case when queue_status='pending' then ' is active and queued for RAPIDS registration.' else ' is queued but blocked until the approved Appendix A occupation version is loaded.' end,
    case when queue_status='pending' then 'info' else 'warning' end,
    jsonb_build_object('enrollment_id',new.id,'student_id',coalesce(new.user_id,new.student_id),'program_slug',new.program_slug,'occupation_code',occupation_code,'rapids_action','register_apprentice','queue_status',queue_status)
  );
  return new;
end;
$$;

revoke all on function public.enqueue_active_apprentice_for_rapids() from public,anon,authenticated;

drop trigger if exists trg_enqueue_active_apprentice_for_rapids on public.program_enrollments;
create trigger trg_enqueue_active_apprentice_for_rapids
after insert or update of status on public.program_enrollments
for each row execute function public.enqueue_active_apprentice_for_rapids();

-- Existing active beauty enrollments that never entered the barber-only queue
-- are reconciled without changing their enrollment status.
insert into public.rapids_action_queue(entity_type,entity_id,action_type,status,payload)
select
  'apprentice',
  e.id,
  'register_apprentice',
  case when e.program_slug='cosmetology-apprenticeship' then 'blocked' else 'pending' end,
  jsonb_build_object(
    'enrollment_id',e.id,
    'student_id',coalesce(e.user_id,e.student_id),
    'program_slug',e.program_slug,
    'occupation_title',case e.program_slug when 'esthetician-apprenticeship' then 'Esthetician' when 'nail-technician-apprenticeship' then 'Manicurist' else 'Cosmetologist' end,
    'occupation_code',case e.program_slug when 'esthetician-apprenticeship' then '2089CB' when 'nail-technician-apprenticeship' then '2090CB' else null end,
    'full_name',e.full_name,
    'email',e.email,
    'host_shop_id',e.host_shop_id,
    'blocked_reason',case when e.program_slug='cosmetology-apprenticeship' then 'APPROVED_APPENDIX_A_VERSION_REQUIRED' else null end
  )
from public.program_enrollments e
where e.program_slug in ('cosmetology-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship')
  and e.status='active'
on conflict(entity_type,entity_id,action_type) do nothing;
