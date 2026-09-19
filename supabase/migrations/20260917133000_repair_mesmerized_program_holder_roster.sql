alter table public.school_applications
  drop constraint if exists school_applications_program_interest_check;

alter table public.school_applications
  add constraint school_applications_program_interest_check
  check (program_interest in ('barber-apprenticeship','cosmetology-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship'));

do $$
declare
  v_holder_id uuid;
  v_primary_program_id uuid;
begin
  select ph.id into v_holder_id
  from public.program_holders ph
  where lower(ph.contact_email) = 'mesmerizedbybeautyl@yahoo.com'
     or lower(ph.organization_name) = 'mesmerized by beauty cosmetology academy'
  order by case when lower(ph.contact_email) = 'mesmerizedbybeautyl@yahoo.com' then 0 else 1 end, ph.created_at asc
  limit 1;

  if v_holder_id is null then
    raise notice 'Mesmerized by Beauty Program Holder record was not found; skipping assignment repair.';
    return;
  end if;

  delete from public.program_holder_programs php
  using public.programs p
  where php.program_holder_id = v_holder_id
    and php.program_id = p.id
    and p.slug = 'hvac-technician';

  update public.program_holder_programs set is_primary = false
  where program_holder_id = v_holder_id and is_primary = true;

  insert into public.program_holder_programs (program_holder_id, program_id, role_in_program, is_primary, status)
  select v_holder_id, p.id, 'delivery_partner', p.slug = 'cosmetology-apprenticeship', 'active'
  from public.programs p
  where p.slug in ('barber-apprenticeship','cosmetology-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship')
  on conflict (program_holder_id, program_id)
  do update set role_in_program = excluded.role_in_program, is_primary = excluded.is_primary, status = 'active';

  select p.id into v_primary_program_id from public.programs p
  where p.slug = 'cosmetology-apprenticeship' limit 1;

  update public.program_holders
  set teaches_multiple = true,
      primary_program_id = coalesce(v_primary_program_id, primary_program_id),
      status = case when status = 'pending' then 'approved' else status end,
      approved_at = coalesce(approved_at, now())
  where id = v_holder_id;

  update public.partners
  set programs = jsonb_build_array('barber-apprenticeship','cosmetology-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship'),
      updated_at = now()
  where lower(contact_email) = 'mesmerizedbybeautyl@yahoo.com'
     or lower(name) = 'mesmerized by beauty cosmetology academy';
end
$$;
