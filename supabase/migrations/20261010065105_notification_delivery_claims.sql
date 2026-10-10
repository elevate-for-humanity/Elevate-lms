-- Deploy before the notification processor. No sends or record deletion occur here.
-- Preserve stale, duplicate and ambiguous attempts for explicit operator review.
alter table public.notification_outbox
  add column if not exists review_required boolean not null default false,
  add column if not exists review_reason text,
  add column if not exists claim_token uuid,
  add column if not exists delivery_started_at timestamptz,
  add column if not exists provider_message_id text,
  add column if not exists notification_key text;

create unique index if not exists notification_outbox_notification_key_uidx
  on public.notification_outbox(notification_key);
create index if not exists notification_outbox_review_idx
  on public.notification_outbox(review_required, created_at) where review_required;

create or replace function public.claim_notification_outbox(p_claim_token uuid, p_limit integer default 50)
returns setof public.notification_outbox
language plpgsql security invoker set search_path = public, pg_temp
as $$
begin
  if p_claim_token is null or p_limit < 1 or p_limit > 50 then
    raise exception 'Invalid notification claim';
  end if;
  -- Serialize only the claim transaction, not network delivery. This also makes
  -- duplicate checks stable across Admin and LMS failover workers.
  perform pg_advisory_xact_lock(hashtext('notification_outbox_claim_v1'));

  update public.notification_outbox o set review_required = true, review_reason = case
    when o.status = 'processing' then 'interrupted_delivery_requires_reconciliation'
    when o.attempts >= least(coalesce(o.max_attempts,5),5) then 'attempts_exhausted'
    when o.template_key = 'portal_completion_reminder' then 'current_portal_requirement_not_verified'
    when o.created_at is null or o.scheduled_for is null then 'missing_notification_time'
    else 'stale_notification_requires_review' end
  where not o.review_required and (
    (o.status = 'processing' and (o.processed_at is null or o.processed_at < now() - interval '10 minutes'))
    or (o.status = 'queued' and (
      o.attempts >= least(coalesce(o.max_attempts,5),5)
      or o.template_key = 'portal_completion_reminder'
      or o.created_at is null or o.scheduled_for is null
      or (o.scheduled_for <= now() and
        greatest(o.created_at,o.scheduled_for) < now() - case
          when o.template_key in ('theory_schedule_start','theory_schedule_stop') then interval '5 minutes'
          else interval '24 hours' end)
    ))
  );

  -- Keep the earliest equivalent notification. A send with unknown outcome also
  -- blocks duplicates; reconciliation must precede any retry.
  update public.notification_outbox o set review_required = true, review_reason = 'duplicate_notification_requires_review'
  where o.status = 'queued' and not o.review_required and exists (
    select 1 from public.notification_outbox previous
    where previous.id <> o.id and previous.template_key = o.template_key
      and lower(previous.to_email) = lower(o.to_email)
      and previous.entity_type is not distinct from o.entity_type
      and previous.entity_id is not distinct from o.entity_id
      and previous.template_data is not distinct from o.template_data
      and previous.created_at >= o.created_at - interval '24 hours'
      and ((previous.created_at, previous.id) < (o.created_at, o.id)
        or previous.status in ('processing','sent'))
  );

  return query with candidates as (
    select id from public.notification_outbox
    where status = 'queued' and not review_required and not coalesce(dead_letter,false)
      and scheduled_for <= now() and attempts < least(coalesce(max_attempts,5),5)
    order by created_at,id for update skip locked limit p_limit
  )
  update public.notification_outbox o set status = 'processing', processed_at = now(),
    claim_token = p_claim_token
  from candidates c where o.id = c.id returning o.*;
end;
$$;
revoke all on function public.claim_notification_outbox(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_notification_outbox(uuid,integer) to service_role;

-- Do not auto-release review_required. Check current business state and provider
-- acceptance before any approved requeue. Existing history is retained.

-- Freeze the existing backlog before the repaired worker is enabled. Rows are
-- preserved for recipient/business-state review; no old reminder is auto-sent.
update public.notification_outbox set review_required = true,
  review_reason = 'pre_cutover_backlog_requires_review'
where status in ('queued','processing') and not review_required;
