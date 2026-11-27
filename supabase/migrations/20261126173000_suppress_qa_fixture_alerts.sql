-- Suppress live alerts for disposable QA fixture enrollments.
--
-- Blocker A (2026-11-26): production QA fixtures (the portal acceptance
-- provisioners) insert real program_enrollments rows. Two row triggers
-- turned those inserts into live staff/holder alerts:
--   * enqueue_active_apprentice_for_rapids() -> rapids_action_queue row
--     + staff_notifications 'apprentice_ready_for_rapids' alert
--     (2,967 stale fixture alerts accumulated 2026-08-22..2026-11-23
--     before this guard; cleaned from production 2026-11-26).
--   * notify_program_holder_on_enrollment() -> notifications
--     'New Student Assigned' to the assigned holder.
-- Fixtures are marked at insert (source/funding_source 'qa-e2e',
-- @qa.invalid emails). Both functions now return early for fixture
-- rows. Function bodies are otherwise verbatim from
-- 20260901093000_queue_all_beauty_apprenticeships_for_rapids.sql and
-- 20260826181500_notify_program_holder_on_enrollment.sql; the triggers
-- themselves are unchanged. Provisioner teardown also deletes any
-- derived alert rows as a backstop.

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
  -- Disposable QA fixtures never generate live staff alerts or RAPIDS
  -- queue rows (Blocker A, 2026-11-26). Fixture enrollments are marked
  -- at insert: source/funding_source 'qa-e2e' and @qa.invalid emails.
  if new.source = 'qa-e2e' or new.funding_source = 'qa-e2e'
     or new.email like '%@qa.invalid' then
    return new;
  end if;
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

create or replace function public.notify_program_holder_on_enrollment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_holder_user_id uuid;
  v_student_name text;
  v_program_name text;
begin
  -- Disposable QA fixtures never alert a program holder (Blocker A,
  -- 2026-11-26). Same fixture markers as the RAPIDS trigger guard.
  if new.source = 'qa-e2e' or new.funding_source = 'qa-e2e'
     or new.email like '%@qa.invalid' then
    return new;
  end if;

  if new.program_holder_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.program_holder_id is not distinct from old.program_holder_id then
    return new;
  end if;

  select ph.user_id
    into v_holder_user_id
  from public.program_holders ph
  where ph.id = new.program_holder_id
    and coalesce(ph.status, 'active') = 'active';

  if v_holder_user_id is null then
    return new;
  end if;

  select coalesce(p.full_name, p.email, 'A learner')
    into v_student_name
  from public.profiles p
  where p.id = coalesce(new.user_id, new.student_id);

  select coalesce(p.name, p.title, 'your program')
    into v_program_name
  from public.programs p
  where p.id = new.program_id;

  insert into public.notifications (
    user_id,
    tenant_id,
    type,
    title,
    message,
    action_url,
    action_label,
    metadata,
    idempotency_key,
    read,
    created_at
  ) values (
    v_holder_user_id,
    new.tenant_id,
    'system',
    'New Student Assigned',
    format(
      '%s has joined your program: %s',
      coalesce(v_student_name, 'A learner'),
      coalesce(v_program_name, 'your program')
    ),
    '/program-holder/students',
    'View Students',
    jsonb_build_object(
      'enrollment_id', new.id,
      'student_id', coalesce(new.user_id, new.student_id),
      'program_id', new.program_id,
      'program_holder_id', new.program_holder_id
    ),
    'program-holder-enrollment:' || new.id::text || ':' || new.program_holder_id::text,
    false,
    now()
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

drop trigger if exists program_enrollments_notify_program_holder
  on public.program_enrollments;
create trigger program_enrollments_notify_program_holder
after insert or update of program_holder_id
on public.program_enrollments
for each row
execute function public.notify_program_holder_on_enrollment();

revoke all on function public.notify_program_holder_on_enrollment() from public;
