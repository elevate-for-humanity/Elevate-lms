-- Keep canonical apprentice identity fields aligned without changing partner/test identities.
insert into public.user_roles(user_id, role)
select p.id, 'apprentice'
from public.profiles p
where p.role = 'apprentice'
  and exists (
    select 1 from public.program_enrollments pe
    where pe.user_id = p.id
      and pe.enrollment_state in ('active','enrolled','onboarding','confirmed','orientation_complete','documents_complete')
      and pe.program_slug in ('barber-apprenticeship','cosmetology-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship','culinary-apprenticeship','electrical','plumbing')
  )
on conflict do nothing;

update public.profiles p
set portal_type = 'apprentice'
where p.role = 'apprentice'
  and exists (
    select 1 from public.program_enrollments pe
    where pe.user_id = p.id
      and pe.enrollment_state in ('active','enrolled','onboarding','confirmed','orientation_complete','documents_complete')
      and pe.program_slug in ('barber-apprenticeship','cosmetology-apprenticeship','esthetician-apprenticeship','nail-technician-apprenticeship','culinary-apprenticeship','electrical','plumbing')
  );

create or replace function public.sync_apprentice_identity_contract()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.role = 'apprentice' then
    new.portal_type := 'apprentice';
    insert into public.user_roles(user_id, role)
    values(new.id, 'apprentice')
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists sync_apprentice_identity_contract_trigger on public.profiles;
create trigger sync_apprentice_identity_contract_trigger
before insert or update of role on public.profiles
for each row execute function public.sync_apprentice_identity_contract();
