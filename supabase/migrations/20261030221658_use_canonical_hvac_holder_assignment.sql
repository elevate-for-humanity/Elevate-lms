-- Respect the canonical enrollment assignment instead of a fixed program/holder UUID.
-- Keep this legacy HVAC-only trigger scoped to the canonical program slug.
create or replace function public.auto_assign_hvac_to_program_holder()
returns trigger language plpgsql set search_path = '' as $$
begin
  if lower(coalesce(new.status,'')) not in ('active','enrolled','in_progress','confirmed')
     or new.program_holder_id is null
     or coalesce(new.user_id,new.student_id) is null then return new; end if;
  if not exists(select 1 from public.programs p where p.id=new.program_id and p.slug='hvac-technician')
     or not exists(select 1 from public.program_holders h where h.id=new.program_holder_id and lower(coalesce(h.status,'')) in ('active','approved')) then return new; end if;
  insert into public.program_holder_students
    (program_holder_id,student_id,program_id,user_id,enrollment_id,status,label,enrolled_at)
  values
    (new.program_holder_id,coalesce(new.user_id,new.student_id),new.program_id,coalesce(new.user_id,new.student_id),new.id,'active','enrolled',now())
  on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.auto_assign_hvac_to_program_holder() from public;
