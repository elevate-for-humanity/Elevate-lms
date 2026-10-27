-- Shared mailbox organization; message removal is recoverable in Trash.
create table public.communication_email_folders (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.communication_email_mailboxes(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique(mailbox_id, name),
  unique(id, mailbox_id)
);
alter table public.communication_email_threads
  add column folder text not null default 'inbox' check (folder in ('inbox','archive','trash','spam')),
  add column custom_folder_id uuid,
  add column starred boolean not null default false,
  add constraint email_thread_folder_mailbox_fk foreign key (custom_folder_id, mailbox_id)
    references public.communication_email_folders(id, mailbox_id);
create index communication_email_threads_folder_idx
  on public.communication_email_threads(mailbox_id, folder, last_message_at desc);
create index communication_email_threads_custom_folder_idx
  on public.communication_email_threads(custom_folder_id) where custom_folder_id is not null;
create table public.communication_email_drafts (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.communication_email_mailboxes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.communication_email_threads(id) on delete set null,
  to_text text not null default '', cc_text text not null default '', bcc_text text not null default '',
  subject text not null default '', body text not null default '',
  updated_at timestamptz not null default now()
);
create index communication_email_drafts_owner_idx on public.communication_email_drafts(user_id,mailbox_id);
alter table public.communication_email_folders enable row level security;
alter table public.communication_email_drafts enable row level security;
create policy "mailbox members read folders" on public.communication_email_folders
  for select to authenticated using (exists (
    select 1 from public.communication_email_mailbox_members m
    where m.mailbox_id=communication_email_folders.mailbox_id and m.user_id=(select auth.uid())
  ));
create policy "authors read own mailbox drafts" on public.communication_email_drafts
  for select to authenticated using (user_id=(select auth.uid()) and exists (
    select 1 from public.communication_email_mailbox_members m
    where m.mailbox_id=communication_email_drafts.mailbox_id and m.user_id=(select auth.uid())
  ));
-- All writes use the authenticated, mailbox-scoped server API.
revoke all on public.communication_email_folders,public.communication_email_drafts from anon,authenticated;
grant select on public.communication_email_folders,public.communication_email_drafts to authenticated;
grant all on public.communication_email_folders,public.communication_email_drafts to service_role;
alter table public.communication_email_mailboxes add column paris_enabled boolean not null default false;
update public.communication_email_mailboxes set paris_enabled=true where address='admissions@elevateforhumanity.org';
create table public.communication_email_filters (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.communication_email_mailboxes(id) on delete cascade,
  field text not null check(field in ('sender','subject','body')),
  contains text not null check(length(trim(contains)) between 1 and 160),
  action text not null check(action in ('skip','folder','archive','spam')),
  folder_id uuid,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key(folder_id,mailbox_id) references public.communication_email_folders(id,mailbox_id),
  check(action<>'folder' or folder_id is not null)
);
create index communication_email_filters_mailbox_idx on public.communication_email_filters(mailbox_id);
alter table public.communication_email_filters enable row level security;
create policy "mailbox members read filters" on public.communication_email_filters for select to authenticated using(exists(
  select 1 from public.communication_email_mailbox_members m where m.mailbox_id=communication_email_filters.mailbox_id and m.user_id=(select auth.uid())
));
revoke all on public.communication_email_filters from anon,authenticated;
grant select on public.communication_email_filters to authenticated;
grant all on public.communication_email_filters to service_role;
insert into public.communication_email_folders(mailbox_id,name)
select id,folder from public.communication_email_mailboxes cross join (values ('Admissions & Applicants'),('Students'),('Host Shops & Partners'),('System Notices')) f(folder) where active and mailbox_kind='department';
-- User-requested expansion: learners and apprentices get their own mailbox only.
-- Department membership remains restricted by the existing provisioning function.
create or replace function public.communication_email_is_eligible_role(role_name text)
returns boolean language sql immutable set search_path='' as $$
 select lower(trim(replace(coalesce(role_name,''),'-','_'))) = any(array[
 'super_admin','admin','org_admin','staff','instructor','case_manager','counselor','advisor','employee','support','student','learner','apprentice','parent','guardian'
 ]::text[])
$$;
select public.communication_email_provision_user(id) from public.profiles
where is_active is distinct from false and role in ('student','learner','apprentice','parent','guardian');
create table public.communication_email_outbox (
 id uuid primary key default gen_random_uuid(),
 campaign_key text not null,
 user_id uuid references auth.users(id) on delete set null,
 recipient_email text not null,
 mailbox_id uuid not null references public.communication_email_mailboxes(id),
 subject text not null, body text not null,
 status text not null default 'pending' check(status in ('pending','processing','sent','failed')),
 provider_message_id text, error_message text,
 created_at timestamptz not null default now(), sent_at timestamptz,
 unique(campaign_key,recipient_email)
);
create index communication_email_outbox_pending_idx on public.communication_email_outbox(created_at) where status='pending';
alter table public.communication_email_outbox enable row level security;
revoke all on public.communication_email_outbox from public,anon,authenticated;
grant all on public.communication_email_outbox to service_role;
create table public.communication_sms_messages (
 id uuid primary key default gen_random_uuid(),
 phone_system_id uuid not null references public.phone_systems(id),
 owner_profile_id uuid references public.profiles(id) on delete set null,
 direction text not null check(direction in ('inbound','outbound')),
 from_number text not null,to_number text not null,body text not null,
 status text not null default 'pending', provider_message_id text unique,
 request_key uuid unique, provider_event_id text unique,error_message text,
 created_at timestamptz not null default now()
);
create index communication_sms_owner_idx on public.communication_sms_messages(owner_profile_id,created_at desc);
create index communication_sms_system_idx on public.communication_sms_messages(phone_system_id,created_at desc);
alter table public.communication_sms_messages enable row level security;
revoke all on public.communication_sms_messages from public,anon,authenticated;
grant all on public.communication_sms_messages to service_role;
-- Bring existing one-to-one conversation keys into the same reply convention.
update public.communication_email_threads t set normalized_subject = t.normalized_subject || ' :: ' || lower(partner.address)
from (
 select distinct on (thread_id) thread_id,
 case when direction='outbound' then to_addresses[1] else sender_email end as address
 from public.communication_email_messages
 where (direction='outbound' and cardinality(to_addresses)=1 and cardinality(cc_addresses)=0 and cardinality(bcc_addresses)=0) or direction='inbound'
 order by thread_id,created_at
) partner where partner.thread_id=t.id and t.normalized_subject not like '% :: %';
