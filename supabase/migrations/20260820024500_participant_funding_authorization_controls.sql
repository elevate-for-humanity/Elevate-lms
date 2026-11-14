create table if not exists public.participant_funding_authorizations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  funding_source text not null,
  status text not null default 'pending' check (status in ('pending','verified','denied','expired','revoked')),
  requested_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  authorization_reference text,
  authorized_amount numeric(12,2),
  valid_from date,
  valid_through date,
  evidence_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'verified' or (verified_at is not null and verified_by is not null and authorization_reference is not null))
);

create index if not exists idx_participant_funding_auth_participant on public.participant_funding_authorizations(participant_id, status);
create index if not exists idx_participant_funding_auth_program on public.participant_funding_authorizations(program_id, status);

alter table public.participant_funding_authorizations enable row level security;

drop policy if exists participant_funding_auth_select_own on public.participant_funding_authorizations;
create policy participant_funding_auth_select_own
on public.participant_funding_authorizations for select
to authenticated
using (participant_id = auth.uid());

drop policy if exists participant_funding_auth_request_own on public.participant_funding_authorizations;
create policy participant_funding_auth_request_own
on public.participant_funding_authorizations for insert
to authenticated
with check (participant_id = auth.uid() and status = 'pending' and verified_at is null and verified_by is null and authorization_reference is null);

create or replace function public.enforce_profile_funding_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.funding_confirmed,false) = true and coalesce(old.funding_confirmed,false) = false then
    if not exists (
      select 1
      from public.participant_funding_authorizations pfa
      where pfa.participant_id = new.id
        and pfa.status = 'verified'
        and (pfa.valid_from is null or pfa.valid_from <= current_date)
        and (pfa.valid_through is null or pfa.valid_through >= current_date)
    ) then
      raise exception 'funding_confirmed requires a current verified participant funding authorization';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_funding_confirmation on public.profiles;
create trigger trg_enforce_profile_funding_confirmation
before update of funding_confirmed on public.profiles
for each row execute function public.enforce_profile_funding_confirmation();

update public.profiles
set funding_confirmed = false
where funding_confirmed = true
  and not exists (
    select 1 from public.participant_funding_authorizations pfa
    where pfa.participant_id = profiles.id and pfa.status = 'verified'
  );

comment on table public.participant_funding_authorizations is 'Participant-level third-party funding authorization ledger. A participant request remains pending until an authorized verifier records documentary evidence.';
