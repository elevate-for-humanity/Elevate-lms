-- Project the canonical legal acceptance into the Program Holder authorization
-- record. The dashboard requires program_holders.mou_signed=true; previously the
-- generic signature recorder wrote only license_agreement_acceptances, leaving
-- approved Program Holders permanently blocked from the dashboard.

create or replace function public.sync_program_holder_mou_acceptance_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.agreement_type <> 'program_holder_mou' then
    return new;
  end if;

  update public.program_holders
  set mou_signed = true,
      mou_signed_at = coalesce(mou_signed_at, new.accepted_at, now()),
      mou_status = 'signed'
  where user_id = new.user_id;

  if not found then
    raise exception 'No Program Holder record is linked to user %', new.user_id
      using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke all on function public.sync_program_holder_mou_acceptance_v1() from public;

drop trigger if exists trg_sync_program_holder_mou_acceptance_v1
  on public.license_agreement_acceptances;

create trigger trg_sync_program_holder_mou_acceptance_v1
after insert on public.license_agreement_acceptances
for each row
when (new.agreement_type = 'program_holder_mou')
execute function public.sync_program_holder_mou_acceptance_v1();

-- Backfill any already-recorded Program Holder MOU acceptances without touching
-- the immutable legal acceptance rows themselves.
update public.program_holders ph
set mou_signed = true,
    mou_signed_at = coalesce(ph.mou_signed_at, accepted.accepted_at),
    mou_status = 'signed'
from (
  select user_id, min(accepted_at) as accepted_at
  from public.license_agreement_acceptances
  where agreement_type = 'program_holder_mou'
  group by user_id
) accepted
where ph.user_id = accepted.user_id
  and (ph.mou_signed is distinct from true or ph.mou_signed_at is null);

comment on function public.sync_program_holder_mou_acceptance_v1()
is 'Marks the linked Program Holder MOU signed when a canonical program_holder_mou agreement acceptance is recorded.';
