-- Registered Apprenticeship audit hardening.
-- Keep timeclock-derived hour entries bound to the authoritative progress entry,
-- canonical program slug, and assigned Host Shop. Restrict privileged approval
-- functions to trusted server-side service-role callers.

create or replace function public.normalize_timeclock_hour_entry_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_progress_id uuid;
  v_program_slug text;
  v_shop_id uuid;
begin
  if new.legacy_source = 'progress_entries' or new.progress_entry_id is not null then
    v_progress_id := coalesce(new.progress_entry_id, new.legacy_id);
    if v_progress_id is null then
      raise exception 'Timeclock-derived hour entry requires progress_entry_id' using errcode = '23514';
    end if;

    select
      coalesce(
        (select p.slug from public.programs p where p.id::text = lower(pe.program_id) limit 1),
        (select p.slug from public.programs p where lower(p.slug) = lower(pe.program_id) limit 1),
        lower(pe.program_id)
      ),
      s.shop_id
    into v_program_slug, v_shop_id
    from public.progress_entries pe
    left join public.apprentice_sites s on s.id = pe.site_id
    where pe.id = v_progress_id;

    if not found then
      raise exception 'Referenced progress entry % does not exist', v_progress_id using errcode = '23503';
    end if;
    if v_program_slug is null or btrim(v_program_slug) = '' then
      raise exception 'Progress entry % has no canonical program identity', v_progress_id using errcode = '23514';
    end if;

    new.progress_entry_id := v_progress_id;
    new.legacy_source := 'progress_entries';
    new.legacy_id := v_progress_id;
    new.program_slug := v_program_slug;
    if v_shop_id is not null then new.host_shop_id := v_shop_id; end if;
  end if;
  return new;
end;
$$;

revoke all on function public.normalize_timeclock_hour_entry_identity() from public, anon, authenticated;

drop trigger if exists trg_normalize_timeclock_hour_entry_identity on public.hour_entries;
create trigger trg_normalize_timeclock_hour_entry_identity
before insert or update of legacy_source, legacy_id, progress_entry_id, program_slug, host_shop_id
on public.hour_entries
for each row execute function public.normalize_timeclock_hour_entry_identity();

with resolved as (
  select he.id,
         coalesce(he.progress_entry_id, he.legacy_id) as progress_id,
         coalesce(
           (select p.slug from public.programs p where p.id::text = lower(pe.program_id) limit 1),
           (select p.slug from public.programs p where lower(p.slug) = lower(pe.program_id) limit 1),
           lower(pe.program_id)
         ) as canonical_slug,
         s.shop_id
  from public.hour_entries he
  join public.progress_entries pe on pe.id = coalesce(he.progress_entry_id, he.legacy_id)
  left join public.apprentice_sites s on s.id = pe.site_id
  where he.legacy_source = 'progress_entries' or he.progress_entry_id is not null
)
update public.hour_entries he
set progress_entry_id = r.progress_id,
    legacy_source = 'progress_entries',
    legacy_id = r.progress_id,
    program_slug = r.canonical_slug,
    host_shop_id = coalesce(r.shop_id, he.host_shop_id)
from resolved r
where he.id = r.id
  and (he.progress_entry_id is distinct from r.progress_id
    or he.legacy_id is distinct from r.progress_id
    or he.legacy_source is distinct from 'progress_entries'
    or he.program_slug is distinct from r.canonical_slug
    or (r.shop_id is not null and he.host_shop_id is distinct from r.shop_id));

revoke all on function public.approve_barber_practical(uuid, uuid) from public, anon, authenticated;
grant execute on function public.approve_barber_practical(uuid, uuid) to service_role;

revoke all on function public.admin_approve_progress_entries(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.admin_approve_progress_entries(uuid[], uuid) to service_role;
