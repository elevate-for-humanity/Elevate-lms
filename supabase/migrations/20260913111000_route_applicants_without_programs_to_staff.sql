-- Applicants who have not selected a program also have no valid holder and
-- belong in the configured staff intake queue.
create or replace function public.route_unassigned_applicant_to_staff()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_staff uuid;
begin
  if new.advisor_assigned is not null then return new; end if;
  if exists (
    select 1 from public.program_holder_programs php
    join public.program_holders ph on ph.id=php.program_holder_id
    where php.program_id=new.program_id and coalesce(php.status,'active')='active'
      and coalesce(ph.status,'active')='active'
  ) then return new; end if;
  select r.staff_user_id into v_staff from public.staff_queue_rules r
   where r.active and r.accepts_unassigned_applicants and r.tenant_id is null
   order by r.created_at, r.id limit 1;
  new.advisor_assigned := v_staff;
  return new;
end $$;
revoke all on function public.route_unassigned_applicant_to_staff() from public;
