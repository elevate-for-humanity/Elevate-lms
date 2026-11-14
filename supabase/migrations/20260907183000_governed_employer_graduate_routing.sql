-- Governed employer graduate routing.
-- Employers only receive candidates for an approved program partnership after
-- verified completion and the learner's explicit employment-sharing consent.

create unique index if not exists employer_partnerships_employer_program_unique
  on public.employer_partnerships (employer_id, program_id);

create table if not exists public.candidate_employer_referrals (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(id) on delete cascade,
  candidate_profile_id uuid not null references public.candidate_employment_profiles(id) on delete cascade,
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  status text not null default 'routed' check (status in ('routed','reviewing','contacted','interviewing','hired','declined','revoked')),
  routed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  consent_version text,
  notes text,
  unique (employer_id, enrollment_id)
);

create index if not exists candidate_employer_referrals_employer_status_idx
  on public.candidate_employer_referrals (employer_id, status, routed_at desc);
create index if not exists candidate_employer_referrals_candidate_idx
  on public.candidate_employer_referrals (candidate_profile_id);

alter table public.candidate_employer_referrals enable row level security;

drop policy if exists employer_reads_own_candidate_referrals on public.candidate_employer_referrals;
create policy employer_reads_own_candidate_referrals
on public.candidate_employer_referrals for select to authenticated
using (
  exists (
    select 1 from public.employers e
    where e.id = employer_id and e.owner_user_id = auth.uid() and e.approved is true
  )
);

drop policy if exists staff_manage_candidate_referrals on public.candidate_employer_referrals;
create policy staff_manage_candidate_referrals
on public.candidate_employer_referrals for all to authenticated
using (rpc_private.is_admin()) with check (rpc_private.is_admin());

grant select on public.candidate_employer_referrals to authenticated;
grant all on public.candidate_employer_referrals to service_role;

-- Replace the legacy profile-only employer check with the canonical employer
-- organization approval check. Staff retain their existing operational access.
drop policy if exists verified_employers_read_consented_candidates on public.candidate_employment_profiles;
create policy verified_employers_read_consented_candidates
on public.candidate_employment_profiles for select to authenticated
using (
  available_for_employment and consent_status = 'granted'
  and (
    exists (
      select 1 from public.employers e
      where e.owner_user_id = auth.uid() and e.approved is true
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','super_admin','staff')
    )
  )
);

create or replace function public.refresh_governed_employer_candidate_referrals()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.candidate_employer_referrals (
    employer_id, candidate_profile_id, enrollment_id, program_id, status, consent_version
  )
  select
    ep.employer_id,
    cep.id,
    pe.id,
    pe.program_id,
    'routed',
    cep.consent_version
  from public.employer_partnerships ep
  join public.employers e on e.id = ep.employer_id and e.approved is true
  join public.program_enrollments pe on pe.program_id = ep.program_id
  join public.candidate_employment_profiles cep on cep.learner_id = pe.user_id
  where ep.status = 'active'
    and cep.available_for_employment is true
    and cep.consent_status = 'granted'
    and (
      pe.certificate_issued_at is not null
      or (
        pe.completed_at is not null
        and pe.lms_completed is true
        and pe.practical_skills_verified is true
      )
    )
  on conflict (employer_id, enrollment_id) do update
    set candidate_profile_id = excluded.candidate_profile_id,
        program_id = excluded.program_id,
        consent_version = excluded.consent_version,
        status = case
          when candidate_employer_referrals.status = 'revoked' then 'routed'
          else candidate_employer_referrals.status
        end,
        updated_at = now();

  update public.candidate_employer_referrals cer
  set status = 'revoked', updated_at = now()
  where cer.status <> 'revoked'
    and not exists (
      select 1
      from public.employer_partnerships ep
      join public.employers e on e.id = ep.employer_id and e.approved is true
      join public.program_enrollments pe on pe.id = cer.enrollment_id and pe.program_id = ep.program_id
      join public.candidate_employment_profiles cep on cep.id = cer.candidate_profile_id and cep.learner_id = pe.user_id
      where ep.employer_id = cer.employer_id
        and ep.status = 'active'
        and cep.available_for_employment is true
        and cep.consent_status = 'granted'
        and (
          pe.certificate_issued_at is not null
          or (pe.completed_at is not null and pe.lms_completed is true and pe.practical_skills_verified is true)
        )
    );
end;
$$;

revoke all on function public.refresh_governed_employer_candidate_referrals() from public, anon, authenticated;
grant execute on function public.refresh_governed_employer_candidate_referrals() to service_role;

create or replace function public.trigger_refresh_governed_employer_candidate_referrals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_governed_employer_candidate_referrals();
  return null;
end;
$$;

revoke all on function public.trigger_refresh_governed_employer_candidate_referrals() from public, anon, authenticated;
grant execute on function public.trigger_refresh_governed_employer_candidate_referrals() to service_role;

-- Claim an invited employer organization when the invited email creates its
-- authenticated profile. Approval remains false until staff verification.
create or replace function public.claim_invited_employer_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.employers
  set owner_user_id = new.id,
      updated_at = now()
  where owner_user_id is null
    and lower(coalesce(contact_email, email, '')) = lower(new.email)
    and coalesce(status, 'pending') in ('pending','submitted','under_review');

  if found then
    new.role := 'employer';
    new.portal_type := 'employer';
    new.company_name := coalesce(
      new.company_name,
      (select coalesce(e.company_name, e.business_name) from public.employers e where e.owner_user_id = new.id limit 1)
    );
  end if;
  return new;
end;
$$;

revoke all on function public.claim_invited_employer_account() from public, anon, authenticated;
grant execute on function public.claim_invited_employer_account() to service_role;

drop trigger if exists claim_invited_employer_account on public.profiles;
create trigger claim_invited_employer_account
before insert or update of email on public.profiles
for each row execute function public.claim_invited_employer_account();

-- Program Holders operate training programs and also need a distinct employer
-- workspace. Preserve program_holder as the primary role and add employer as a
-- secondary RBAC role. Their assigned programs start pending employer review.
create or replace function public.provision_program_holder_employer_workspaces()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employer_role_id uuid;
begin
  select id into v_employer_role_id from public.roles where name = 'employer' limit 1;

  insert into public.employers (
    owner_user_id, business_name, company_name, contact_name, email, contact_email,
    trade, industry, approved, status, notes, created_at, updated_at
  )
  select
    ph.user_id,
    ph.organization_name,
    ph.organization_name,
    ph.contact_name,
    coalesce(ph.contact_email, p.email),
    coalesce(ph.contact_email, p.email),
    'workforce_training',
    'Education and Workforce Development',
    false,
    'pending',
    'Provisioned from active Program Holder record; employer onboarding and approval required.',
    now(),
    now()
  from public.program_holders ph
  join public.profiles p on p.id = ph.user_id
  where ph.status = 'active'
    and ph.user_id is not null
    and coalesce(ph.contact_email, p.email) is not null
    and ph.organization_name not like '[QA]%'
    and not exists (select 1 from public.employers e where e.owner_user_id = ph.user_id);

  if v_employer_role_id is not null then
    insert into public.user_roles (user_id, role_id, tenant_id, role, assigned_at, created_at)
    select p.id, v_employer_role_id, p.tenant_id, 'employer', now(), now()
    from public.profiles p
    join public.program_holders ph on ph.user_id = p.id and ph.status = 'active'
    where ph.organization_name not like '[QA]%'
      and not exists (
        select 1 from public.user_roles ur
        where ur.user_id = p.id and (ur.role_id = v_employer_role_id or ur.role = 'employer')
      );
  end if;

  insert into public.employer_partnerships (
    employer_id, program_id, status, partnership_type, start_date, notes, created_at, updated_at
  )
  select
    e.id,
    php.program_id,
    case when e.approved is true then 'active' else 'pending' end,
    'graduate_employment',
    current_date,
    'Program Holder employer pathway; graduate routing activates after employer approval.',
    now(),
    now()
  from public.program_holder_programs php
  join public.program_holders ph on ph.id = php.program_holder_id and ph.status = 'active'
  join public.employers e on e.owner_user_id = ph.user_id
  where php.status = 'active'
    and ph.organization_name not like '[QA]%'
  on conflict (employer_id, program_id) do nothing;

  perform public.refresh_governed_employer_candidate_referrals();
end;
$$;

revoke all on function public.provision_program_holder_employer_workspaces() from public, anon, authenticated;
grant execute on function public.provision_program_holder_employer_workspaces() to service_role;

create or replace function public.trigger_provision_program_holder_employer_workspaces()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.provision_program_holder_employer_workspaces();
  return null;
end;
$$;

revoke all on function public.trigger_provision_program_holder_employer_workspaces() from public, anon, authenticated;
grant execute on function public.trigger_provision_program_holder_employer_workspaces() to service_role;

drop trigger if exists provision_holder_employer_from_holder on public.program_holders;
create trigger provision_holder_employer_from_holder
after insert or update of status, user_id, organization_name, contact_name, contact_email
on public.program_holders for each statement
execute function public.trigger_provision_program_holder_employer_workspaces();

drop trigger if exists provision_holder_employer_from_program on public.program_holder_programs;
create trigger provision_holder_employer_from_program
after insert or update of program_holder_id, program_id, status
on public.program_holder_programs for each statement
execute function public.trigger_provision_program_holder_employer_workspaces();

select public.provision_program_holder_employer_workspaces();

drop trigger if exists refresh_employer_referrals_from_enrollment on public.program_enrollments;
create trigger refresh_employer_referrals_from_enrollment
after insert or update of program_id, user_id, completed_at, certificate_issued_at, lms_completed, practical_skills_verified
on public.program_enrollments for each statement
execute function public.trigger_refresh_governed_employer_candidate_referrals();

drop trigger if exists refresh_employer_referrals_from_candidate on public.candidate_employment_profiles;
create trigger refresh_employer_referrals_from_candidate
after insert or update of available_for_employment, consent_status, consent_version
on public.candidate_employment_profiles for each statement
execute function public.trigger_refresh_governed_employer_candidate_referrals();

drop trigger if exists refresh_employer_referrals_from_partnership on public.employer_partnerships;
create trigger refresh_employer_referrals_from_partnership
after insert or update of employer_id, program_id, status
on public.employer_partnerships for each statement
execute function public.trigger_refresh_governed_employer_candidate_referrals();

drop trigger if exists refresh_employer_referrals_from_employer on public.employers;
create trigger refresh_employer_referrals_from_employer
after update of approved, owner_user_id on public.employers for each statement
execute function public.trigger_refresh_governed_employer_candidate_referrals();

select public.refresh_governed_employer_candidate_referrals();
