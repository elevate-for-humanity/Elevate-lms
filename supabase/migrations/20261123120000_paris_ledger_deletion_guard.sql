-- Protect the PARIS repair ledger from premature deletion. The database
-- requires a verified release and a full archive matching the current row.
-- An unguarded row aborts the entire delete statement.
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
revoke all on public.paris_code_repairs_archive from public, anon, authenticated, service_role;
grant select on public.paris_code_repairs_archive to service_role;
create index if not exists paris_code_repairs_archive_fingerprint
  on public.paris_code_repairs_archive (fingerprint);

-- Both the archive and deletion gate require the runtime receipt written
-- by the repair finalizer. A merge SHA can exist earlier during deployment.
create or replace function public.paris_repair_release_verified(repair public.paris_code_repairs)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(
    (repair).status = 'verified'
    and (repair).verification->'exactRuntimeSha' = 'true'::jsonb
    and nullif(btrim((repair).verification->>'runtimeVerifiedAt'), '') is not null
    and (repair).verification->>'tests' = 'passed'
    and (repair).verification->>'deployments' = 'passed'
    and ((repair).source_job_id is null or (repair).verification#>>'{courseExecution,state}' = 'passed'),
    false
  );
$$;
revoke all on function public.paris_repair_release_verified(public.paris_code_repairs)
  from public, anon, authenticated;

-- Archive the current locked row. If evidence changes later, the delete gate
-- requires a fresh archive of the updated snapshot.
create or replace function public.archive_paris_code_repair(p_repair_id uuid, p_actor_id uuid default null)
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
  select * into v_repair from public.paris_code_repairs where id = p_repair_id for update;
  if not found then
    raise exception 'PARIS_REPAIR_NOT_FOUND' using errcode = '02000';
  end if;
  if v_repair.release_sha is null or btrim(v_repair.release_sha) = '' then
    raise exception 'PARIS_DELETE_REQUIRES_RELEASE_SHA' using errcode = '55000';
  end if;
  if not public.paris_repair_release_verified(v_repair) then
    raise exception 'PARIS_DELETE_REQUIRES_VERIFIED_RELEASE' using errcode = '55000';
  end if;
  insert into public.paris_code_repairs_archive as archive
    (repair_id, fingerprint, goal, status, release_sha, verification,
     error_code, source_job_id, workflow_run_id, attempt_count, snapshot, archived_by)
  values
    (v_repair.id, v_repair.fingerprint, v_repair.goal, v_repair.status,
     v_repair.release_sha, v_repair.verification, v_repair.error_code,
     v_repair.source_job_id, v_repair.workflow_run_id,
     v_repair.attempt_count, to_jsonb(v_repair), p_actor_id)
  on conflict (repair_id) do update set
    fingerprint = excluded.fingerprint, goal = excluded.goal, status = excluded.status,
    release_sha = excluded.release_sha, verification = excluded.verification,
    error_code = excluded.error_code, source_job_id = excluded.source_job_id,
    workflow_run_id = excluded.workflow_run_id, attempt_count = excluded.attempt_count,
    snapshot = excluded.snapshot, archived_by = excluded.archived_by, archived_at = now()
    where archive.snapshot is distinct from excluded.snapshot
  returning id into v_archive_id;
  if v_archive_id is null then
    select id into v_archive_id
      from public.paris_code_repairs_archive where repair_id = p_repair_id;
  end if;
  return v_archive_id;
end;
$$;

revoke all on function public.archive_paris_code_repair(uuid, uuid) from public, anon, authenticated;
grant execute on function public.archive_paris_code_repair(uuid, uuid) to service_role;

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
  if not public.paris_repair_release_verified(old) then
    raise exception 'PARIS_DELETE_REQUIRES_VERIFIED_RELEASE' using errcode = '55000';
  end if;
  if not exists (
    select 1 from public.paris_code_repairs_archive a
     where a.repair_id = old.id
       and a.fingerprint = old.fingerprint
       and a.release_sha = old.release_sha
       and a.snapshot = to_jsonb(old)
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
