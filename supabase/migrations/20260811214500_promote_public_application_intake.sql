-- Promote public application_intake rows into canonical review tables in the
-- same transaction. This removes the production dependency on the optional
-- process-intake Edge Function and prevents acknowledged submissions from being
-- stranded in application_intake.

create or replace function public.promote_public_application_intake_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_destination_id uuid;
begin
  if new.status <> 'received' then
    return new;
  end if;

  if new.application_type = 'employer' then
    insert into public.employer_applications (
      tenant_id,
      company_name,
      contact_name,
      email,
      phone,
      status,
      data,
      intake,
      state
    ) values (
      new.resolved_tenant_id,
      nullif(trim(new.payload->>'company_name'), ''),
      nullif(trim(new.payload->>'contact_name'), ''),
      lower(nullif(trim(new.payload->>'email'), '')),
      nullif(trim(new.payload->>'phone'), ''),
      'pending',
      new.payload,
      new.payload,
      'submitted'
    )
    returning id into v_destination_id;

    update public.application_intake
    set status = 'processed',
        processed_at = now(),
        destination_table = 'employer_applications',
        destination_id = v_destination_id,
        error = null
    where id = new.id;

  elsif new.application_type = 'staff' then
    insert into public.staff_applications (
      tenant_id,
      full_name,
      email,
      phone,
      position,
      status,
      data
    ) values (
      new.resolved_tenant_id,
      coalesce(
        nullif(trim(new.payload->>'full_name'), ''),
        trim(concat_ws(' ', new.payload->>'first_name', new.payload->>'last_name'))
      ),
      lower(nullif(trim(new.payload->>'email'), '')),
      nullif(trim(new.payload->>'phone'), ''),
      nullif(trim(new.payload->>'position'), ''),
      'pending',
      new.payload
    )
    returning id into v_destination_id;

    update public.application_intake
    set status = 'processed',
        processed_at = now(),
        destination_table = 'staff_applications',
        destination_id = v_destination_id,
        error = null
    where id = new.id;

  elsif new.application_type = 'program_holder' then
    insert into public.program_holder_applications (
      tenant_id,
      organization_name,
      contact_name,
      email,
      phone,
      status,
      data
    ) values (
      new.resolved_tenant_id,
      nullif(trim(new.payload->>'organization_name'), ''),
      nullif(trim(new.payload->>'contact_name'), ''),
      lower(nullif(trim(new.payload->>'email'), '')),
      nullif(trim(new.payload->>'phone'), ''),
      'pending',
      new.payload
    )
    returning id into v_destination_id;

    update public.application_intake
    set status = 'processed',
        processed_at = now(),
        destination_table = 'program_holder_applications',
        destination_id = v_destination_id,
        error = null
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.promote_public_application_intake_v1() from public;
grant execute on function public.promote_public_application_intake_v1() to service_role;

drop trigger if exists trg_promote_public_application_intake_v1
  on public.application_intake;

create trigger trg_promote_public_application_intake_v1
after insert on public.application_intake
for each row
when (new.status = 'received')
execute function public.promote_public_application_intake_v1();

comment on function public.promote_public_application_intake_v1()
is 'Synchronously promotes Employer, Staff, and Program Holder public intake rows into canonical Admin review tables and marks intake processed.';
