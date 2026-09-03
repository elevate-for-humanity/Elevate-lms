create or replace function public.enforce_barber_supervised_progress_entry()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid;
  v_program_slug text;
  v_site_shop_id uuid;
  v_ok boolean;
begin
  select a.user_id into v_user_id from public.apprentices a where a.id=new.apprentice_id;
  if v_user_id is null then return new; end if;

  v_program_slug := coalesce(
    (select p.slug from public.programs p where p.id::text=lower(new.program_id) limit 1),
    (select p.slug from public.programs p where lower(p.slug)=lower(new.program_id) limit 1),
    lower(new.program_id)
  );
  if v_program_slug <> 'barber-apprenticeship' then return new; end if;

  select s.shop_id into v_site_shop_id from public.apprentice_sites s where s.id=new.site_id;
  if v_site_shop_id is null then
    raise exception 'Barber OJL requires a Host Shop site assignment' using errcode='23514';
  end if;

  select exists(
    select 1 from public.apprentice_placements ap
    where ap.student_id=v_user_id
      and ap.program_slug='barber-apprenticeship'
      and ap.status='active'
      and ap.shop_id=v_site_shop_id
      and ap.supervisor_user_id is not null
  ) into v_ok;

  if not coalesce(v_ok,false) then
    raise exception 'Barber OJL requires an active Host Shop placement with assigned 1:1 supervisor' using errcode='23514';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_barber_supervised_progress_entry() from public, anon, authenticated;

drop trigger if exists trg_enforce_barber_supervised_progress_entry on public.progress_entries;
create trigger trg_enforce_barber_supervised_progress_entry
before insert or update of apprentice_id, program_id, site_id on public.progress_entries
for each row execute function public.enforce_barber_supervised_progress_entry();
