-- PR4 (#2692): deletion guard for the PARIS repair ledger.
--
-- On 2026-11-17 a raw SQL DO $$ block deleted all 254 paris_code_repairs
-- rows with no live verification and no same-day archive. No application
-- code path deletes from that table, so an app-level check alone cannot
-- prevent a recurrence. This migration is the database half of the guard
-- (the app half is lib/devstudio/paris-ledger-deletion-guard.mjs):
--
--  1. paris_code_repairs_archive: the durable archive destination. A row
--     may only be deleted from the ledger after an archive row exists
--     for that exact repair id with the same fingerprint + release_sha.
--  2. archive_paris_code_repair(uuid): the sanctioned archive call.
--     SECURITY DEFINER, service_role only. Refuses rows with no
--     release_sha — a row with no live-release SHA is evidence, not
--     cleanup, and must be repaired and verified first.
--  3. BEFORE DELETE trigger on paris_code_repairs: raises unless the row
--     has a release_sha AND a matching archive row exists. This fires for
--     service_role and for raw SQL alike, so a bulk DELETE of unarchived
--     rows fails on the first row and deletes nothing.
--
-- Residual risk, stated plainly: a postgres superuser can disable a
-- trigger (SET session_replication_role = replica). The guard stops
-- accidents, application deletes and ad-hoc SQL; it does not stop a
-- determined superuser. Keep database activity logging on and review
-- deletes of this table in audit, not just in code.
--
-- This migration applies no data changes and deletes nothing.

set lock_timeout = '2s';
set statement_timeout = '90s';

create table if not exists public.paris_code_repairs_archive (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null unique,
  fingerprint text not null,
  goal text,
  status text,
  release_sha text not null,
  verification jsonb,
  error_code text,
  source_job_id uuid,
  workflow_run_id bigint,
  attempt_count integer,
  snapshot jsonb not null,
  archived_by uuid,
  archived_at timestamptz not null default now()
);

alter table public.paris_code_repairs_archive enable row level security;
revoke all on public.paris_code_repairs_archive from anon, authenticated;
grant all on public.paris_code_repairs_archive to service_role;
create index if not exists paris_code_repairs_archive_fingerprint
  on public.paris_code_repairs_archive (fingerprint);

-- Sanctioned archive call: copy one ledger row into the archive and
-- return the archive row id. Idempotent per repair_id: a second call
-- returns the existing archive row instead of duplicating it.
create or replace function public.archive_paris_code_repair(p_repair_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_repair public.paris_code_repairs%rowtype;
  v_archive_id uuid;
begin
  if p_repair_id is null then
    raise exception 'PARIS_DELETE_REPAIRS_REQUIRED' using errcode = '22023';
  end if;
  select * into v_repair from public.paris_code_repairs where id = p_repair_id;
  if not found then
    raise exception 'PARIS_REPAIR_NOT_FOUND' using errcode = '02000';
  end if;
  if v_repair.release_sha is null or btrim(v_repair.release_sha) = '' then
    raise exception 'PARIS_DELETE_REQUIRES_RELEASE_SHA' using errcode = '55000';
  end if;
  insert into public.paris_code_repairs_archive
    (repair_id, fingerprint, goal, status, release_sha, verification,
     error_code, source_job_id, workflow_run_id, attempt_count, snapshot)
  values
    (v_repair.id, v_repair.fingerprint, v_repair.goal, v_repair.status,
     v_repair.release_sha, v_repair.verification, v_repair.error_code,
     v_repair.source_job_id, v_repair.workflow_run_id,
     v_repair.attempt_count, to_jsonb(v_repair))
  on conflict (repair_id) do nothing
  returning id into v_archive_id;
  if v_archive_id is null then
    select id into v_archive_id
      from public.paris_code_repairs_archive where repair_id = p_repair_id;
  end if;
  return v_archive_id;
end;
$$;

revoke all on function public.archive_paris_code_repair(uuid) from public, anon, authenticated;
grant execute on function public.archive_paris_code_repair(uuid) to service_role;

-- Deletion gate: a ledger row may be deleted only after it has a
-- live-release SHA and a matching archive row. Checked per row, so a
-- bulk DELETE fails atomically on the first unguarded row.
create or replace function public.paris_ledger_deletion_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.release_sha is null or btrim(old.release_sha) = '' then
    raise exception 'PARIS_DELETE_REQUIRES_RELEASE_SHA' using errcode = '55000';
  end if;
  if not exists (
    select 1 from public.paris_code_repairs_archive a
     where a.repair_id = old.id
       and a.fingerprint = old.fingerprint
       and a.release_sha = old.release_sha
  ) then
    raise exception 'PARIS_DELETE_REQUIRES_ARCHIVE' using errcode = '55000';
  end if;
  return old;
end;
$$;

drop trigger if exists paris_ledger_deletion_gate on public.paris_code_repairs;
create trigger paris_ledger_deletion_gate
  before delete on public.paris_code_repairs
  for each row execute function public.paris_ledger_deletion_gate();
