-- Apply through the normal migration pipeline after database and portal QA.
-- The Achieve hold is released only when the currently approved packet has
-- its MOU and separate NDA receipts recorded by the holder signing flow.

create or replace function public.achieve_cna_referral_ready_v1(
  p_features jsonb, p_mou_signed boolean
) returns boolean
language sql stable security invoker set search_path = ''
as $$
  select coalesce(
    p_mou_signed
    and jsonb_typeof(p_features->'achieve_cna_agreements') = 'object'
    and p_features->'achieve_cna_signed_mou'->'packet' = p_features->'achieve_cna_agreements'
    and p_features->'achieve_cna_signed_nda'->'packet' = p_features->'achieve_cna_agreements'
    and nullif(p_features->'achieve_cna_signed_mou'->>'acceptance_id', '') is not null
    and nullif(p_features->'achieve_cna_signed_nda'->>'acceptance_id', '') is not null,
    false
  );
$$;

revoke all on function public.achieve_cna_referral_ready_v1(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.achieve_cna_referral_ready_v1(jsonb, boolean) to service_role;

create or replace function public.apply_reviewed_holder_referrals_v1(
  p_holder_id uuid, p_program_id uuid, p_rows jsonb, p_actor_id uuid, p_enable_existing boolean
) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_holder public.program_holders%rowtype;
  v_ids uuid[];
  v_written integer;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array'
    or jsonb_array_length(p_rows) > 500
    or p_enable_existing is distinct from (jsonb_array_length(p_rows) = 0) then
    raise check_violation using message = 'Invalid reviewed referral batch';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('holder-referrals:' || p_program_id::text, 0));
  select * into v_holder from public.program_holders where id = p_holder_id for update;
  if not found
    or lower(coalesce(v_holder.status, '')) not in ('active', 'approved', 'approved_pending_mou')
    or not exists (
      select 1 from public.program_holder_programs hp
      where hp.program_holder_id = p_holder_id and hp.program_id = p_program_id
        and coalesce(hp.status, 'active') = 'active'
    )
    or (
      p_holder_id = 'acc9f5ab-8804-432e-9b12-aac1a6c86426'
      and not public.achieve_cna_referral_ready_v1(v_holder.features, v_holder.mou_signed)
    ) then
    raise check_violation using message = 'Holder referral release conditions not met';
  end if;

  if p_enable_existing then
    if not exists (
      select 1 from public.program_holder_students s
      join public.applications a on a.id = s.application_id
      where s.program_holder_id = p_holder_id and s.program_id = p_program_id
        and s.status in ('applied', 'applicant', 'pending')
        and a.revoked_at is null
        and lower(coalesce(a.status, '')) in ('submitted', 'pending', 'under_review', 'in_review', 'pending_admin_review', 'applied')
    ) then
      raise check_violation using message = 'No eligible existing referrals for this holder';
    end if;
  else
    select array_agg(application_id) into v_ids
      from jsonb_to_recordset(p_rows) as r(application_id uuid);
    perform 1 from public.applications where id = any(v_ids) order by id for update;

    insert into public.program_holder_students as saved (
      program_holder_id, application_id, student_id, user_id, program_id,
      applicant_name, applicant_email, applicant_phone, status,
      application_status, label, created_at, updated_at
    )
    select p_holder_id, a.id, a.user_id, a.user_id, p_program_id,
      r.applicant_name, nullif(lower(btrim(a.email)), ''), a.phone, 'applied',
      a.status, 'Elevate-assigned referral', coalesce(a.created_at, now()), now()
    from jsonb_to_recordset(p_rows) as r(
      application_id uuid, applicant_name text, applicant_email text, applicant_phone text
    )
    join public.applications a on a.id = r.application_id
    join public.programs p on p.id = p_program_id
    where a.revoked_at is null
      and lower(coalesce(a.status, '')) in ('submitted', 'pending', 'under_review', 'in_review', 'pending_admin_review', 'applied')
      and (
        a.program_id = p_program_id or (a.program_id is null and
          (a.program_slug = p.slug or a.program_interest in (p.slug, p.title)
            or (p.slug = 'cdl-training' and a.program_interest ilike '%cdl%')))
      )
      and r.applicant_name is not distinct from coalesce(nullif(btrim(a.full_name), ''),
        nullif(btrim(a.name), ''), nullif(btrim(concat_ws(' ', a.first_name, a.last_name)), ''))
      and r.applicant_email is not distinct from nullif(lower(btrim(a.email)), '')
      and r.applicant_phone is not distinct from a.phone
      and not exists (
        select 1 from public.program_enrollments e
        where e.program_id = p_program_id and e.user_id = a.user_id and e.revoked_at is null
          and e.status in ('active', 'enrolled', 'in_progress', 'completed', 'funded')
      )
      and not exists (
        select 1 from public.program_holder_students prior
        where prior.program_id = p_program_id
          and lower(coalesce(prior.status, 'applied')) not in ('routing_replaced', 'inactive', 'removed')
          and (
            prior.application_id = a.id
            or prior.user_id = a.user_id
            or (nullif(lower(btrim(r.applicant_email)), '') is not null
              and lower(btrim(prior.applicant_email)) = lower(btrim(r.applicant_email)))
            or (nullif(btrim(r.applicant_name), '') is not null and prior.applicant_name <> 'Applicant'
              and regexp_replace(lower(btrim(prior.applicant_name)), '[[:space:]]+', ' ', 'g')
                = regexp_replace(lower(btrim(r.applicant_name)), '[[:space:]]+', ' ', 'g')
              and regexp_replace(coalesce(prior.applicant_phone, ''), '[^0-9]', '', 'g')
                = regexp_replace(coalesce(r.applicant_phone, ''), '[^0-9]', '', 'g'))
          )
      )
    on conflict (program_holder_id, application_id) where application_id is not null
    do update set
      status = excluded.status, application_status = excluded.application_status,
      student_id = excluded.student_id, user_id = excluded.user_id,
      applicant_name = excluded.applicant_name, applicant_email = excluded.applicant_email,
      applicant_phone = excluded.applicant_phone, label = excluded.label, updated_at = excluded.updated_at
    where saved.status = 'routing_replaced' and saved.enrollment_id is null;

    get diagnostics v_written = row_count;
    if v_written <> cardinality(v_ids) then
      raise check_violation using message = 'Reviewed referral batch changed';
    end if;
  end if;

  update public.program_holders
  set features = jsonb_set(coalesce(features, '{}'::jsonb), '{recruiting_enabled}', 'true'::jsonb),
      updated_at = now()
  where id = p_holder_id;

  insert into public.admin_audit_events (action, actor_user_id, target_type, target_id, metadata)
  values (case when p_enable_existing then 'program_holder.enable_referral_recruiting' else 'program_holder.assign_applicants' end,
    p_actor_id, 'program_holder', p_holder_id,
    jsonb_build_object('program_id', p_program_id, 'assigned_application_ids', coalesce(to_jsonb(v_ids), '[]'::jsonb)));
end;
$$;

revoke all on function public.apply_reviewed_holder_referrals_v1(uuid, uuid, jsonb, uuid, boolean) from public, anon, authenticated;
grant execute on function public.apply_reviewed_holder_referrals_v1(uuid, uuid, jsonb, uuid, boolean) to service_role;

create or replace function public.route_application_to_program_holder_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program_id uuid;
  v_holder_id uuid;
  v_name text;
begin
  if new.revoked_at is not null or lower(coalesce(new.status, '')) in ('rejected', 'withdrawn', 'revoked') then
    update public.program_holder_students
    set status = 'routing_replaced', application_status = new.status, updated_at = now()
    where application_id = new.id
      and status in ('applied', 'applicant', 'pending')
      and enrollment_id is null;
    return new;
  end if;

  v_program_id := new.program_id;
  if v_program_id is null then
    select p.id into v_program_id
    from public.programs p
    where p.slug = coalesce(nullif(new.program_slug, ''), nullif(new.pathway_slug, ''))
       or lower(p.title) = lower(coalesce(nullif(new.program_name, ''), nullif(new.program_interest, '')))
    order by coalesce(p.is_active, true) desc, p.created_at asc
    limit 1;
  end if;

  if v_program_id is null then return new; end if;

  select php.program_holder_id into v_holder_id
  from public.program_holder_programs php
  join public.program_holders ph on ph.id = php.program_holder_id
  where php.program_id = v_program_id
    and coalesce(php.status, 'active') = 'active'
    and lower(coalesce(php.role_in_program, 'owner')) in ('owner', 'primary', 'training_provider')
    -- Approved holders awaiting MOU signature ARE routing targets. A holder
    -- in 'approved_pending_mou' is approved; only the signature is
    -- outstanding. Coordinators are still excluded by the role filter above.
    and lower(coalesce(ph.status, '')) in ('active', 'approved', 'approved_pending_mou')
    and (ph.id <> 'acc9f5ab-8804-432e-9b12-aac1a6c86426'
      or public.achieve_cna_referral_ready_v1(ph.features, ph.mou_signed))
  order by coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
  limit 1;

  if v_holder_id is null then return new; end if;
  v_name := coalesce(nullif(new.full_name, ''), nullif(new.name, ''), trim(concat_ws(' ', new.first_name, new.last_name)));

  update public.program_holder_students phs
  set status = 'routing_replaced',
      updated_at = now()
  where phs.application_id = new.id
    and phs.program_holder_id <> v_holder_id
    and lower(coalesce(phs.status, 'applied')) in ('applied', 'applicant', 'pending', 'inactive', 'removed');

  insert into public.program_holder_students (
    program_holder_id, application_id, student_id, user_id, program_id,
    applicant_name, applicant_email, applicant_phone, status,
    application_status, label, created_at, updated_at
  ) values (
    v_holder_id, new.id, new.user_id, new.user_id, v_program_id,
    v_name, new.email, new.phone, 'applied',
    coalesce(nullif(new.status, ''), 'applied'), 'Student application',
    coalesce(new.created_at, now()), now()
  )
  on conflict (program_holder_id, application_id) where application_id is not null
  do update set
    student_id = excluded.student_id,
    user_id = excluded.user_id,
    program_id = excluded.program_id,
    applicant_name = excluded.applicant_name,
    applicant_email = excluded.applicant_email,
    applicant_phone = excluded.applicant_phone,
    application_status = excluded.application_status,
    status = case when program_holder_students.status = 'routing_replaced'
      and program_holder_students.enrollment_id is null then 'applied' else program_holder_students.status end,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.route_application_to_program_holder_v1() from public;
grant execute on function public.route_application_to_program_holder_v1() to service_role;

comment on function public.route_application_to_program_holder_v1()
is 'Routes each canonical application to exactly one approved or active primary training owner; coordinators do not receive the owner queue and Achieve requires its approved agreement receipts.';

drop trigger if exists trg_route_application_to_program_holder_v1 on public.applications;
create trigger trg_route_application_to_program_holder_v1
after insert or update of program_id, program_slug, pathway_slug, program_name, program_interest, status, user_id, revoked_at
on public.applications for each row execute function public.route_application_to_program_holder_v1();
