alter table public.workone_survey_responses
  add column if not exists access_token_hash text,
  add column if not exists program_slug text,
  add column if not exists program_name text,
  add column if not exists program_code text,
  add column if not exists progress_status text not null default 'not_started',
  add column if not exists funding_status text,
  add column if not exists appointment_date date,
  add column if not exists workone_center text,
  add column if not exists case_manager_name text,
  add column if not exists case_manager_email text,
  add column if not exists approval_reference text,
  add column if not exists last_updated_by_applicant_at timestamptz,
  add column if not exists last_follow_up_email_at timestamptz;

create unique index if not exists workone_survey_application_unique
  on public.workone_survey_responses(application_id)
  where application_id is not null;

create unique index if not exists workone_survey_access_token_hash_unique
  on public.workone_survey_responses(access_token_hash)
  where access_token_hash is not null;

create table if not exists public.workone_progress_updates (
  id uuid primary key default gen_random_uuid(),
  workone_response_id uuid not null references public.workone_survey_responses(id) on delete cascade,
  application_id uuid,
  progress_status text not null,
  funding_status text,
  appointment_date date,
  workone_center text,
  case_manager_name text,
  case_manager_email text,
  approval_reference text,
  feedback text,
  created_at timestamptz not null default now()
);

create index if not exists idx_workone_progress_updates_response
  on public.workone_progress_updates(workone_response_id, created_at desc);

create index if not exists idx_workone_progress_updates_application
  on public.workone_progress_updates(application_id, created_at desc);

alter table public.workone_progress_updates enable row level security;

comment on table public.workone_progress_updates is
  'Append-only applicant WorkOne/Indiana Career Connect funding progress history. Public access is through the tokenized marketing API only.';
