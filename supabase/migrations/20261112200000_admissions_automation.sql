set lock_timeout='2s';
set statement_timeout='90s';

-- Admissions automation. Lead dedupe, binder checklist and staff review tasks
-- reuse existing tables (crm_leads, apprentice_document_types/documents, tasks)
-- via the durable process-application-submissions queue. Only the outbound
-- communication ledger and a few intake columns are genuinely missing.

alter table public.applications add column if not exists date_of_birth date;
alter table public.applications add column if not exists address text;
alter table public.leads add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table public.leads add column if not exists assigned_at timestamptz;

create table if not exists public.communication_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  recipient_email text not null,
  channel text not null default 'email' check (channel in ('email', 'sms')),
  template_key text not null,
  subject text,
  status text not null check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists communication_log_lead_id_idx
  on public.communication_log (lead_id, created_at desc) where lead_id is not null;
create index if not exists communication_log_application_id_idx
  on public.communication_log (application_id) where application_id is not null;
create index if not exists communication_log_recipient_email_idx
  on public.communication_log (lower(recipient_email), created_at desc);

alter table public.communication_log enable row level security;
revoke all on table public.communication_log from anon, authenticated;
grant all on table public.communication_log to service_role;
