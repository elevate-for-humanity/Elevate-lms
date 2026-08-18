alter table public.hour_entries
  add column if not exists approved_by_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_hour_entries_approved_by_user_id on public.hour_entries(approved_by_user_id);

update public.hour_entries he
set approved_by_user_id = p.id
from public.profiles p
where he.approved_by_user_id is null
  and he.approved_by is not null
  and lower(he.approved_by) = lower(p.email)
  and (he.status='approved' or he.approval_status='approved');

create or replace function public.enforce_barber_hour_verifier_integrity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_role text;
  v_supervisor_ok boolean;
begin
  if new.program_slug <> 'barber-apprenticeship' then return new; end if;
  if not (new.status='approved' or new.approval_status='approved') then return new; end if;
  if tg_op='UPDATE'
     and old.status='approved'
     and old.approval_status='approved'
     and new.status is not distinct from old.status
     and new.approval_status is not distinct from old.approval_status
     and new.approved_by_user_id is not distinct from old.approved_by_user_id then
    return new;
  end if;

  if new.user_id is null or new.host_shop_id is null then
    raise exception 'Approved Barber hour entry requires apprentice and Host Shop identity' using errcode='23514';
  end if;
  if new.approved_by_user_id is null then
    raise exception 'Approved Barber hour entry requires verifier user identity' using errcode='23514';
  end if;

  select lower(coalesce(p.role::text,'')) into v_role from public.profiles p where p.id=new.approved_by_user_id;
  if v_role in ('admin','super_admin','staff','org_admin') then return new; end if;

  select exists(
    select 1 from public.apprentice_placements ap
    where ap.student_id=new.user_id
      and ap.program_slug='barber-apprenticeship'
      and ap.status='active'
      and ap.shop_id=new.host_shop_id
      and ap.supervisor_user_id=new.approved_by_user_id
  ) into v_supervisor_ok;

  if not coalesce(v_supervisor_ok,false) then
    raise exception 'Barber hour verifier is not the assigned active supervisor' using errcode='23514';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_barber_hour_verifier_integrity() from public, anon, authenticated;

drop trigger if exists trg_enforce_barber_hour_verifier_integrity on public.hour_entries;
create trigger trg_enforce_barber_hour_verifier_integrity
before insert or update of status, approval_status, approved_by_user_id, host_shop_id, user_id, program_slug
on public.hour_entries
for each row execute function public.enforce_barber_hour_verifier_integrity();
