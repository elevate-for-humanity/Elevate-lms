create table if not exists public.applicant_outreach_contacts (
 id uuid primary key default gen_random_uuid(),
 campaign_key text not null,
 email text not null,
 first_name text,
 programs jsonb not null default '[]',
 source_records jsonb not null default '[]',
 send_status text not null default 'queued' check(send_status in ('queued','sending','accepted','failed','unknown','suppressed')),
 interest text check(interest in ('interested','not_interested','needs_follow_up')),
 sent_at timestamptz,
 replied_at timestamptz,
 archived_at timestamptz,
 error_code text,
 created_at timestamptz not null default now(),
 unique(campaign_key,email)
);
create table if not exists public.applicant_outreach_replies (
 message_id uuid primary key references public.communication_email_messages(id),
 inbound_event_key text not null unique,
 contact_id uuid not null references public.applicant_outreach_contacts(id),
 outcome text not null check(outcome in ('interested','not_interested','needs_follow_up')),
 followup_status text not null default 'pending' check(followup_status in ('pending','sending','accepted','failed','unknown','not_required')),
 created_at timestamptz not null default now()
);
alter table public.applicant_outreach_contacts enable row level security;
alter table public.applicant_outreach_replies enable row level security;
revoke all on public.applicant_outreach_contacts,public.applicant_outreach_replies from anon,authenticated;
grant select on public.applicant_outreach_contacts,public.applicant_outreach_replies to authenticated;
grant all on public.applicant_outreach_contacts,public.applicant_outreach_replies to service_role;
create policy applicant_outreach_admin_read on public.applicant_outreach_contacts for select to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','super_admin')));
create policy applicant_outreach_reply_admin_read on public.applicant_outreach_replies for select to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','super_admin')));
alter table public.applications add column if not exists outreach_interest text;
alter table public.program_holder_students add column if not exists outreach_interest text;

-- A clear voluntary decline removes pending intake records from the active queue.
-- Enrollment, payments, credentials and completed records are preserved.
create or replace function public.record_applicant_outreach_reply(p_message_id uuid,p_contact_id uuid,p_outcome text)
returns boolean language plpgsql security definer set search_path=public as $$
declare c public.applicant_outreach_contacts; m public.communication_email_messages;
begin
 if p_outcome not in ('interested','not_interested','needs_follow_up') then raise exception 'Invalid outcome'; end if;
 select * into c from public.applicant_outreach_contacts where id=p_contact_id and send_status='accepted' for update;
 select * into m from public.communication_email_messages where id=p_message_id and direction='inbound';
 if c.id is null or m.id is null or lower(trim(m.sender_email))<>c.email or m.received_at<c.sent_at then raise exception 'Reply does not match an accepted outreach contact'; end if;
 insert into public.applicant_outreach_replies(message_id,inbound_event_key,contact_id,outcome,followup_status)
 values(p_message_id,coalesce(regexp_replace(m.inbound_event_id,':[a-f0-9-]{36}$','','i'),m.id::text),p_contact_id,p_outcome,case when p_outcome='interested' then 'pending' else 'not_required' end)
 on conflict do nothing;
 if not found then return false; end if;
 update public.applicant_outreach_contacts set interest=p_outcome,replied_at=m.received_at,
 archived_at=case when p_outcome='not_interested' then now() else archived_at end where id=c.id;
 update public.applications set outreach_interest=p_outcome,updated_at=now(),
 status=case when p_outcome='not_interested' and status in ('submitted','pending_funding','pending_admin_review','pending_workone','funding_review','scheduled','in_review','under_review','waitlisted') then 'withdrawn' else status end,
 next_step=case when p_outcome='interested' then 'PARIS enrollment follow-up: review program links and funding/payment options' when p_outcome='needs_follow_up' then 'PARIS: clarify applicant reply' else next_step end
 where id in(select (r->>'id')::uuid from jsonb_array_elements(c.source_records) r where r->>'table'='applications');
 update public.program_holder_students set outreach_interest=p_outcome,updated_at=now(),
 status=case when p_outcome='not_interested' and status in ('applied','pending') then 'withdrawn' else status end
 where id in(select (r->>'id')::uuid from jsonb_array_elements(c.source_records) r where r->>'table'='program_holder_students');
 if p_outcome='not_interested' then
  update public.leads set status='archived',updated_at=now()
  where id in(select (r->>'id')::uuid from jsonb_array_elements(c.source_records) r where r->>'table'='leads');
 end if;
 return true;
end $$;
revoke all on function public.record_applicant_outreach_reply(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.record_applicant_outreach_reply(uuid,uuid,text) to service_role;
