set local lock_timeout='3s'; set local statement_timeout='8s';
do $patch$
declare source text;
begin
 select pg_get_functiondef('public.queue_due_theory_schedule_notifications(timestamptz)'::regprocedure) into source;
 if position('s.learner_confirmed_at' in source)=0 then
  source:=replace(source,'where s.active and p.is_active is not false',
   'where s.active and p.is_active is not false and (s.program_slug <> ''cosmetology-apprenticeship'' or s.learner_confirmed_at is not null)');
  if position('s.learner_confirmed_at' in source)=0 then raise exception 'REMINDER_SCOPE_PATCH_TARGET_MISSING'; end if;
  execute source;
 end if;
end $patch$;
-- Hold old unclaimed reminders for unconfirmed availability; retain all delivery history.
update public.notification_outbox o set review_required=true,review_reason='unconfirmed_theory_window_superseded',
 metadata=coalesce(o.metadata,'{}'::jsonb)||jsonb_build_object('held_for_schedule_confirmation',true,'preserved_previous_template_data',o.template_data)
from public.apprenticeship_theory_schedules s
where o.entity_id=s.id and o.entity_type='apprenticeship_theory_schedule'
and s.program_slug='cosmetology-apprenticeship' and s.learner_confirmed_at is null
and o.template_key in('theory_schedule_start','theory_schedule_stop')
and o.status='queued' and not o.review_required and o.claim_token is null and o.delivery_started_at is null;

