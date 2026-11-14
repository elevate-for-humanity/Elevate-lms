create or replace function public.enforce_barber_competency_verifier_integrity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_program_slug text;
  v_student_id uuid;
  v_verifier_role text;
  v_supervisor_ok boolean;
begin
  select pe.program_slug, coalesce(pe.user_id, pe.student_id)
    into v_program_slug, v_student_id
  from public.program_enrollments pe
  where pe.id = new.enrollment_id;

  if v_program_slug <> 'barber-apprenticeship' or not coalesce(new.completed,false) then
    return new;
  end if;

  if new.verified_by is null then
    raise exception 'Verified Barber competency requires verifier identity' using errcode='23514';
  end if;

  select lower(coalesce(p.role::text,'')) into v_verifier_role
  from public.profiles p where p.id=new.verified_by;

  if v_verifier_role in ('admin','super_admin','staff','instructor','org_admin') then
    return new;
  end if;

  select exists(
    select 1 from public.apprentice_placements ap
    where ap.student_id=v_student_id
      and ap.program_slug='barber-apprenticeship'
      and ap.status='active'
      and ap.shop_id is not null
      and ap.supervisor_user_id=new.verified_by
  ) into v_supervisor_ok;

  if not coalesce(v_supervisor_ok,false) then
    raise exception 'Verifier is not the assigned active Barber supervisor' using errcode='23514';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_barber_competency_verifier_integrity() from public, anon, authenticated;

drop trigger if exists trg_enforce_barber_competency_verifier_integrity on public.apprentice_competency_records;
create trigger trg_enforce_barber_competency_verifier_integrity
before insert or update of completed, verified_by, enrollment_id on public.apprentice_competency_records
for each row execute function public.enforce_barber_competency_verifier_integrity();
