-- Phone notifications are independent attempts. Provider acceptance is distinct
-- from recipient delivery; ambiguous attempts require review rather than retries.
create table public.phone_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.phone_callback_tasks(id),
  recipient_profile_id uuid not null references public.profiles(id),
  message_kind text not null check (message_kind in ('paris','voicemail')),
  channel text not null check (channel in ('email','sms','push')),
  status text not null default 'processing' check (status in ('processing','accepted','review_required','skipped')),
  provider_message_id text,
  accepted_device_count integer check (accepted_device_count >= 0),
  outcome_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique(task_id,recipient_profile_id,message_kind,channel)
);
create index phone_notification_recipient_idx on public.phone_notification_deliveries(recipient_profile_id,started_at desc);
alter table public.phone_notification_deliveries enable row level security;
revoke all on public.phone_notification_deliveries from anon, authenticated;
grant select on public.phone_notification_deliveries to authenticated;
grant all on public.phone_notification_deliveries to service_role;
create policy "recipient reads own phone notification evidence" on public.phone_notification_deliveries
  for select to authenticated using (recipient_profile_id = (select auth.uid()));
comment on table public.phone_notification_deliveries is
  'At most one automatic attempt per task/recipient/kind/channel. accepted means provider accepted, not delivered. Never requeue ambiguous attempts without reconciliation.';

-- Keep recordings and recipient assignments under server control. Row ownership
-- alone must not let an authenticated client replace a recording URL or assignee.
revoke update on public.phone_callback_tasks,public.voicemails from anon,authenticated;
grant update(status,read_at) on public.phone_callback_tasks to authenticated;
grant update(status,is_read) on public.voicemails to authenticated;
