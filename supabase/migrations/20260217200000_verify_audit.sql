-- Audit log for credential verification attempts (privacy-safe)
-- No full IP stored; uses hashed key for rate-limit correlation only.

create table if not exists public.verify_audit (
  id bigserial primary key,
  ip_hash text not null,
  credential_id text not null,
  result text not null check (result in ('ok', 'not_found', 'blocked', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists verify_audit_created_at_idx
  on public.verify_audit (created_at desc);

create index if not exists verify_audit_credential_id_idx
  on public.verify_audit (credential_id);

-- RLS: server-only access (no public policies)
alter table public.verify_audit enable row level security;

-- Admin read policy
create policy "admin_read_verify_audit"
  on public.verify_audit for select
  to authenticated
  using ((auth.jwt() ->> 'role') = 'admin');

comment on table public.verify_audit is 'Privacy-safe audit log for /verify credential lookups';
