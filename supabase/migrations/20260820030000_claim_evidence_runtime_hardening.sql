-- Production claim-evidence hardening.
-- This migration mirrors the production database change applied on 2026-08-20.

create table if not exists public.student_risk_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  risk_score numeric not null,
  status text not null,
  factors jsonb not null default '[]'::jsonb,
  days_since_activity integer not null default 0,
  progress_percentage numeric not null default 0,
  overdue_count integer not null default 0,
  evaluated_at timestamptz not null default now(),
  source text not null default 'calculate_student_risk_status'
);

alter table public.student_risk_events enable row level security;
create index if not exists idx_student_risk_events_user_time
  on public.student_risk_events(user_id, evaluated_at desc);

create policy "student_risk_events_self_read"
  on public.student_risk_events
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_staff()));

create policy "student_risk_events_staff_write"
  on public.student_risk_events
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create or replace function public.capture_student_risk_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT'
     or new.risk_score is distinct from old.risk_score
     or new.status is distinct from old.status
     or new.risk_factors is distinct from old.risk_factors then
    insert into public.student_risk_events(
      user_id, risk_score, status, factors, days_since_activity,
      progress_percentage, overdue_count, evaluated_at
    ) values (
      new.user_id,
      coalesce(new.risk_score, 0),
      coalesce(new.status, 'unknown'),
      coalesce(new.risk_factors, '[]'::jsonb),
      coalesce(nullif(new.days_since_activity, '')::integer, 0),
      coalesce(new.progress_percentage, 0),
      coalesce(new.overdue_count, 0),
      now()
    );
  end if;
  return new;
end;
$$;

revoke all on function public.capture_student_risk_event() from public, anon, authenticated;
grant execute on function public.capture_student_risk_event() to service_role;

drop trigger if exists trg_capture_student_risk_event on public.student_risk_status;
create trigger trg_capture_student_risk_event
after insert or update of risk_score, status, risk_factors
on public.student_risk_status
for each row execute function public.capture_student_risk_event();

create table if not exists public.credential_integrity_records (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null unique references public.certificates(id) on delete cascade,
  certificate_number text not null,
  algorithm text not null default 'sha256',
  payload_hash text not null,
  payload_version integer not null default 1,
  generated_at timestamptz not null default now()
);

alter table public.credential_integrity_records enable row level security;
create unique index if not exists idx_credential_integrity_number
  on public.credential_integrity_records(certificate_number);

create policy "credential_integrity_public_read"
  on public.credential_integrity_records
  for select to anon, authenticated
  using (true);

create or replace function public.certificate_integrity_hash(c public.certificates)
returns text
language sql
immutable
set search_path = pg_catalog, public, extensions
as $$
  select encode(
    extensions.digest(
      concat_ws('|',
        coalesce(c.id::text, ''),
        coalesce(c.certificate_number, ''),
        coalesce(c.course_id::text, ''),
        coalesce(c.program_id::text, ''),
        coalesce(c.tenant_id::text, ''),
        coalesce(c.issued_at::text, ''),
        coalesce(c.completion_date::text, ''),
        coalesce(c.issuance_snapshot::text, '')
      ),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function public.certificate_integrity_hash(public.certificates) from public, anon, authenticated;
grant execute on function public.certificate_integrity_hash(public.certificates) to service_role;

create or replace function public.capture_certificate_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  insert into public.credential_integrity_records(
    certificate_id, certificate_number, payload_hash, payload_version, generated_at
  ) values (
    new.id,
    new.certificate_number,
    public.certificate_integrity_hash(new),
    1,
    now()
  )
  on conflict (certificate_id) do nothing;
  return new;
end;
$$;

revoke all on function public.capture_certificate_integrity() from public, anon, authenticated;
grant execute on function public.capture_certificate_integrity() to service_role;

drop trigger if exists trg_capture_certificate_integrity on public.certificates;
create trigger trg_capture_certificate_integrity
after insert on public.certificates
for each row execute function public.capture_certificate_integrity();

insert into public.credential_integrity_records(
  certificate_id, certificate_number, payload_hash, payload_version, generated_at
)
select c.id, c.certificate_number, public.certificate_integrity_hash(c), 1, now()
from public.certificates c
where c.certificate_number is not null
on conflict (certificate_id) do nothing;

create or replace function public.verify_certificate_integrity(p_certificate_number text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c public.certificates%rowtype;
  r public.credential_integrity_records%rowtype;
  current_hash text;
begin
  select * into c
  from public.certificates
  where certificate_number = p_certificate_number
  limit 1;

  if not found then
    return jsonb_build_object('found', false, 'integrity_valid', false);
  end if;

  select * into r
  from public.credential_integrity_records
  where certificate_id = c.id
  limit 1;

  current_hash := public.certificate_integrity_hash(c);

  return jsonb_build_object(
    'found', true,
    'integrity_valid', r.id is not null and r.payload_hash = current_hash,
    'algorithm', coalesce(r.algorithm, 'sha256'),
    'payload_hash', r.payload_hash,
    'status', c.status,
    'certificate_number', c.certificate_number,
    'issued_at', c.issued_at,
    'verification_url', c.verification_url
  );
end;
$$;

revoke all on function public.verify_certificate_integrity(text) from public;
grant execute on function public.verify_certificate_integrity(text) to anon, authenticated, service_role;
