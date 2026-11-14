create or replace function public.enqueue_platform_event_v1(
  p_event_type text,
  p_category text,
  p_source text,
  p_subject_type text,
  p_subject_id text,
  p_actor_id uuid default null,
  p_tenant_id uuid default null,
  p_correlation_id text default null,
  p_idempotency_key text default null,
  p_payload jsonb default '{}'::jsonb,
  p_message text default null,
  p_severity text default 'info'
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  insert into public.platform_events (
    event_type, category, severity, source, actor_id, actor_type,
    subject_id, subject_type, tenant_id, correlation_id, idempotency_key,
    payload, message, resolved, processing_status, available_at
  ) values (
    p_event_type, p_category, p_severity, p_source, p_actor_id,
    case when p_actor_id is null then 'system' else 'user' end,
    p_subject_id, p_subject_type, p_tenant_id, p_correlation_id,
    p_idempotency_key, coalesce(p_payload, '{}'::jsonb), p_message,
    false, 'pending', now()
  )
  on conflict (idempotency_key) where idempotency_key is not null do nothing
  returning id into v_id;

  if v_id is null and p_idempotency_key is not null then
    select id into v_id
    from public.platform_events
    where idempotency_key = p_idempotency_key
    limit 1;
  end if;

  return v_id;
end;
$$;

revoke all on function public.enqueue_platform_event_v1(text,text,text,text,text,uuid,uuid,text,text,jsonb,text,text) from public;
grant execute on function public.enqueue_platform_event_v1(text,text,text,text,text,uuid,uuid,text,text,jsonb,text,text) to service_role;

create or replace function public.capture_domain_orchestration_event_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user text;
  v_course text;
begin
  if tg_table_name = 'applications' then
    if tg_op = 'INSERT' and new.status = 'submitted' then
      perform public.enqueue_platform_event_v1(
        'application.submitted','application','db.trigger.applications','application',new.id::text,
        new.user_id,null,new.id::text,'application-submitted:' || new.id::text,
        jsonb_build_object('program_id',new.program_id,'program_slug',coalesce(new.program_slug,new.pathway_slug,new.program_interest),'source',new.source)
      );
    elsif tg_op = 'UPDATE' then
      if old.status is distinct from new.status and new.status = 'submitted' then
        perform public.enqueue_platform_event_v1(
          'application.submitted','application','db.trigger.applications','application',new.id::text,
          new.user_id,null,new.id::text,'application-submitted:' || new.id::text,
          jsonb_build_object('program_id',new.program_id,'program_slug',coalesce(new.program_slug,new.pathway_slug,new.program_interest),'source',new.source)
        );
      end if;
      if old.status is distinct from new.status and new.status = 'approved' then
        perform public.enqueue_platform_event_v1(
          'application.approved','application','db.trigger.applications','application',new.id::text,
          coalesce(new.reviewer_id,new.eligibility_verified_by,new.funding_verified_by),null,new.id::text,
          'application-approved:' || new.id::text,
          jsonb_build_object('user_id',new.user_id,'program_id',new.program_id,'program_slug',coalesce(new.program_slug,new.pathway_slug,new.program_interest),'funding_source',coalesce(new.funding_source,new.recommended_funding_source))
        );
      end if;
    end if;

  elsif tg_table_name = 'program_enrollments' then
    if tg_op = 'INSERT' and (new.status = 'active' or new.enrollment_state in ('active','enrolled')) then
      perform public.enqueue_platform_event_v1(
        'enrollment.confirmed','enrollment','db.trigger.program_enrollments','program_enrollment',new.id::text,
        coalesce(new.user_id,new.student_id),new.tenant_id,new.id::text,'enrollment-confirmed:' || new.id::text,
        jsonb_build_object('program_id',new.program_id,'program_slug',new.program_slug,'course_id',new.course_id,'funding_source',new.funding_source)
      );
    elsif tg_op = 'UPDATE' then
      if (old.status is distinct from new.status or old.enrollment_state is distinct from new.enrollment_state)
         and (new.status = 'active' or new.enrollment_state in ('active','enrolled')) then
        perform public.enqueue_platform_event_v1(
          'enrollment.confirmed','enrollment','db.trigger.program_enrollments','program_enrollment',new.id::text,
          coalesce(new.user_id,new.student_id),new.tenant_id,new.id::text,'enrollment-confirmed:' || new.id::text,
          jsonb_build_object('program_id',new.program_id,'program_slug',new.program_slug,'course_id',new.course_id,'funding_source',new.funding_source)
        );
      end if;
      if old.orientation_completed_at is null and new.orientation_completed_at is not null then
        perform public.enqueue_platform_event_v1(
          'orientation.completed','enrollment','db.trigger.program_enrollments','program_enrollment',new.id::text,
          coalesce(new.user_id,new.student_id),new.tenant_id,new.id::text,'orientation-completed:' || new.id::text,
          jsonb_build_object('program_id',new.program_id,'program_slug',new.program_slug)
        );
      end if;
      if old.host_shop_id is distinct from new.host_shop_id and new.host_shop_id is not null then
        perform public.enqueue_platform_event_v1(
          'apprentice.assigned','workforce','db.trigger.program_enrollments','program_enrollment',new.id::text,
          coalesce(new.user_id,new.student_id),new.tenant_id,new.id::text,'apprentice-assigned:' || new.id::text || ':' || new.host_shop_id::text,
          jsonb_build_object('host_shop_id',new.host_shop_id,'program_id',new.program_id,'program_slug',new.program_slug)
        );
      end if;
    end if;

  elsif tg_table_name = 'course_enrollments' then
    if (tg_op = 'INSERT' and (new.completed_at is not null or new.status = 'completed'))
       or (tg_op = 'UPDATE' and ((old.completed_at is null and new.completed_at is not null) or (old.status is distinct from new.status and new.status = 'completed'))) then
      v_user := coalesce(new.student_id::text,new.id::text);
      v_course := coalesce(new.course_id::text,new.id::text);
      perform public.enqueue_platform_event_v1(
        'course.completed','lms','db.trigger.course_enrollments','course',v_course,
        new.student_id,null,new.id::text,'course-completed:' || v_user || ':' || v_course,
        jsonb_build_object('enrollment_id',new.id,'student_id',new.student_id,'course_id',new.course_id,'score',new.score)
      );
    end if;

  elsif tg_table_name = 'course_progress' then
    if (tg_op = 'INSERT' and (new.completed_at is not null or new.status = 'completed' or coalesce(new.progress_percentage,0) >= 100))
       or (tg_op = 'UPDATE' and ((old.completed_at is null and new.completed_at is not null) or (old.status is distinct from new.status and new.status = 'completed') or (coalesce(old.progress_percentage,0) < 100 and coalesce(new.progress_percentage,0) >= 100))) then
      v_user := coalesce(new.user_id::text,new.id::text);
      v_course := coalesce(new.course_id::text,new.id::text);
      perform public.enqueue_platform_event_v1(
        'course.completed','lms','db.trigger.course_progress','course',v_course,
        new.user_id,null,new.id::text,'course-completed:' || v_user || ':' || v_course,
        jsonb_build_object('progress_id',new.id,'enrollment_id',new.enrollment_id,'user_id',new.user_id,'course_id',new.course_id,'progress_percentage',new.progress_percentage)
      );
    end if;

  elsif tg_table_name = 'certificates' then
    if tg_op = 'INSERT' then
      perform public.enqueue_platform_event_v1(
        'certificate.issued','credential','db.trigger.certificates','certificate',new.id::text,
        coalesce(new.user_id,new.student_id),new.tenant_id,new.id::text,'certificate-issued:' || new.id::text,
        jsonb_build_object('course_id',new.course_id,'program_id',new.program_id,'enrollment_id',new.enrollment_id,'certificate_number',new.certificate_number)
      );
    end if;

  elsif tg_table_name = 'host_shop_applications' then
    if (tg_op = 'INSERT' and new.status = 'approved')
       or (tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'approved') then
      perform public.enqueue_platform_event_v1(
        'host_shop.approved','workforce','db.trigger.host_shop_applications','host_shop_application',new.id::text,
        null,null,new.id::text,'host-shop-approved:' || new.id::text,
        jsonb_build_object('course_slug',new.course_slug,'stripe_session_id',new.stripe_session_id)
      );
    end if;

  elsif tg_table_name = 'exam_sessions' then
    if tg_op = 'INSERT' then
      perform public.enqueue_platform_event_v1(
        'testing.registration_created','testing','db.trigger.exam_sessions','exam_session',new.id::text,
        new.student_id,new.tenant_id,new.id::text,'testing-registration:' || new.id::text,
        jsonb_build_object('provider',new.provider::text,'exam_code',new.exam_code,'program_slug',new.program_slug,'is_retest',new.is_retest)
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.capture_domain_orchestration_event_v1() from public;

drop trigger if exists orchestration_applications_v1 on public.applications;
create trigger orchestration_applications_v1 after insert or update on public.applications
for each row execute function public.capture_domain_orchestration_event_v1();

drop trigger if exists orchestration_program_enrollments_v1 on public.program_enrollments;
create trigger orchestration_program_enrollments_v1 after insert or update on public.program_enrollments
for each row execute function public.capture_domain_orchestration_event_v1();

drop trigger if exists orchestration_course_enrollments_v1 on public.course_enrollments;
create trigger orchestration_course_enrollments_v1 after insert or update on public.course_enrollments
for each row execute function public.capture_domain_orchestration_event_v1();

drop trigger if exists orchestration_course_progress_v1 on public.course_progress;
create trigger orchestration_course_progress_v1 after insert or update on public.course_progress
for each row execute function public.capture_domain_orchestration_event_v1();

drop trigger if exists orchestration_certificates_v1 on public.certificates;
create trigger orchestration_certificates_v1 after insert on public.certificates
for each row execute function public.capture_domain_orchestration_event_v1();

drop trigger if exists orchestration_host_shop_applications_v1 on public.host_shop_applications;
create trigger orchestration_host_shop_applications_v1 after insert or update on public.host_shop_applications
for each row execute function public.capture_domain_orchestration_event_v1();

drop trigger if exists orchestration_exam_sessions_v1 on public.exam_sessions;
create trigger orchestration_exam_sessions_v1 after insert on public.exam_sessions
for each row execute function public.capture_domain_orchestration_event_v1();
