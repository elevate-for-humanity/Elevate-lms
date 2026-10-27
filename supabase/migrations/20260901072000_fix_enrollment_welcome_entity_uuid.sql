-- Keep notification_outbox.entity_id UUID-typed throughout the enrollment
-- welcome trigger. Casting NEW.id to text caused every active enrollment insert
-- to roll back before its welcome notification could be queued.

create or replace function public.enqueue_program_enrollment_welcome()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user_id uuid;
  v_email text;
  v_name text;
  v_program_name text;
  v_is_enrolled boolean;
begin
  v_is_enrolled :=
    lower(coalesce(new.status, '')) in ('active', 'enrolled') or
    lower(coalesce(new.enrollment_state, '')) in ('active', 'enrolled');

  if not v_is_enrolled then
    return new;
  end if;

  if tg_op = 'UPDATE' and (
    lower(coalesce(old.status, '')) in ('active', 'enrolled') or
    lower(coalesce(old.enrollment_state, '')) in ('active', 'enrolled')
  ) then
    return new;
  end if;

  v_user_id := coalesce(new.user_id, new.student_id);
  if v_user_id is null then
    return new;
  end if;

  select p.email, coalesce(nullif(p.full_name, ''), nullif(p.first_name, ''), 'Student')
    into v_email, v_name
    from public.profiles p
   where p.id = v_user_id;

  if nullif(trim(coalesce(v_email, '')), '') is null then
    return new;
  end if;

  select coalesce(nullif(pr.name, ''), nullif(new.program_slug, ''), 'your program')
    into v_program_name
    from public.programs pr
   where pr.id = new.program_id;

  v_program_name := coalesce(v_program_name, nullif(new.program_slug, ''), 'your program');

  if exists (
    select 1
      from public.notification_outbox o
     where o.template_key = 'enrollment_welcome'
       and o.entity_type = 'program_enrollment'
       and o.entity_id = new.id
       and coalesce(o.dead_letter, false) = false
  ) then
    return new;
  end if;

  insert into public.notification_outbox (
    to_email, recipient_email, recipient_id, channel, type, template_key,
    template_data, status, attempts, max_attempts, scheduled_for,
    entity_type, entity_id, metadata
  ) values (
    v_email, v_email, v_user_id, 'email', 'enrollment_welcome', 'enrollment_welcome',
    jsonb_build_object(
      'name', v_name,
      'username', v_email,
      'email', v_email,
      'program_name', v_program_name,
      'enrollment_id', new.id,
      'login_url', 'https://app.elevateforhumanity.org/login',
      'dashboard_url', 'https://app.elevateforhumanity.org/lms/dashboard',
      'password_setup_url', 'https://www.elevateforhumanity.org/forgot-password',
      'security_url', 'https://app.elevateforhumanity.org/account/settings/security'
    ),
    'queued', 0, 5, now(),
    'program_enrollment', new.id,
    jsonb_build_object('source', 'program_enrollments_trigger', 'program_id', new.program_id)
  );

  return new;
end;
$function$;

revoke all on function public.enqueue_program_enrollment_welcome()
  from public, anon, authenticated;
grant execute on function public.enqueue_program_enrollment_welcome()
  to service_role;
