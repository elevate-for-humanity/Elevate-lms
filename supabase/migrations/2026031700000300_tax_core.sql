-- Tax platform core schema
-- Apply in Supabase Dashboard → SQL Editor
-- Tables: tax_firms, tax_clients, tax_returns, tax_return_events, transmission_statuses

create extension if not exists pgcrypto;

-- ── Firms ─────────────────────────────────────────────────────────────────

create table if not exists tax_firms (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  ein         text,
  phone       text,
  address     jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Clients ───────────────────────────────────────────────────────────────

create table if not exists tax_clients (
  id          uuid        primary key default gen_random_uuid(),
  firm_id     uuid        references tax_firms(id) on delete set null,
  first_name  text        not null,
  last_name   text        not null,
  email       text,
  phone       text,
  -- SSN stored as hash only — never plaintext
  ssn_hash    text,
  ssn_last4   text,
  dob         date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Add columns that may be missing from the live table (created before this migration)
alter table tax_clients add column if not exists firm_id uuid references tax_firms(id) on delete set null;
alter table tax_clients add column if not exists dob     date;

create index if not exists idx_tax_clients_firm_id on tax_clients(firm_id);

-- ── Returns ───────────────────────────────────────────────────────────────

create table if not exists tax_returns (
  id                  uuid        primary key default gen_random_uuid(),
  tax_year            int         not null,
  client_id           uuid        not null references tax_clients(id) on delete restrict,
  firm_id             uuid        references tax_firms(id) on delete set null,
  office_id           uuid,
  preparer_user_id    uuid,
  reviewer_user_id    uuid,
  status              text        not null default 'draft' check (
    status in (
      'draft',
      'in_preparation',
      'ready_for_review',
      'review_changes_requested',
      'ready_for_signature',
      'ready_to_file',
      'transmitted',
      'accepted',
      'rejected',
      'amended'
    )
  ),
  -- Full return domain object. xml_content is generated at transmission time, not stored here.
  return_json         jsonb       not null default '{}'::jsonb,
  created_by_user_id  uuid        not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Add firm-side columns to tax_returns if missing (live table predates this migration)
alter table tax_returns add column if not exists client_id           uuid references tax_clients(id) on delete restrict;
alter table tax_returns add column if not exists firm_id             uuid references tax_firms(id) on delete set null;
alter table tax_returns add column if not exists office_id           uuid;
alter table tax_returns add column if not exists preparer_user_id    uuid;
alter table tax_returns add column if not exists reviewer_user_id    uuid;
alter table tax_returns add column if not exists return_json         jsonb not null default '{}'::jsonb;
alter table tax_returns add column if not exists created_by_user_id  uuid;

create index if not exists idx_tax_returns_client_id  on tax_returns(client_id);
create index if not exists idx_tax_returns_firm_id    on tax_returns(firm_id);
create index if not exists idx_tax_returns_status     on tax_returns(status);
create index if not exists idx_tax_returns_tax_year   on tax_returns(tax_year);

-- ── Return events (immutable audit log) ───────────────────────────────────

create table if not exists tax_return_events (
  id              uuid        primary key default gen_random_uuid(),
  return_id       uuid        not null references tax_returns(id) on delete cascade,
  actor_user_id   uuid,
  event_type      text        not null,
  from_status     text,
  to_status       text,
  event_data      jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_tax_return_events_return_id on tax_return_events(return_id);

-- ── Transmission statuses ─────────────────────────────────────────────────

create table if not exists transmission_statuses (
  id              uuid        primary key default gen_random_uuid(),
  return_id       uuid        not null references tax_returns(id) on delete cascade,
  transmission_id text        not null unique,
  ack_status      text        not null default 'pending' check (
    ack_status in ('pending', 'accepted', 'rejected')
  ),
  ack_code        text,
  ack_message     text,
  -- Raw IRS XML response stored as text (not xml type — avoids parser issues)
  raw_response    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_transmission_statuses_return_id  on transmission_statuses(return_id);
create index if not exists idx_transmission_statuses_ack_status on transmission_statuses(ack_status);

-- ── updated_at trigger ────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_tax_returns_updated_at') then
    create trigger set_tax_returns_updated_at
      before update on tax_returns
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_tax_clients_updated_at') then
    create trigger set_tax_clients_updated_at
      before update on tax_clients
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_transmission_statuses_updated_at') then
    create trigger set_transmission_statuses_updated_at
      before update on transmission_statuses
      for each row execute function set_updated_at();
  end if;
end $$;
