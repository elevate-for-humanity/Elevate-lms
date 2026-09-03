-- Correct the closed-loop escalation bridge to use the existing operator_tasks contract.
-- operator_tasks.task_type is constrained; use canonical task_type='fix'.
-- operator_tasks.status uses queued/running/completed/failed/canceled.

create or replace function public.sync_application_remediation_operator_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_task_id uuid;
  missing_items text;
begin
  if new.workflow_key <> 'application_missing_documents' or new.subject_type <> 'application' then
    return new;
  end if;

  if new.state = 'escalated' and new.escalation_status in ('needed', 'created') then
    select id into existing_task_id
    from public.operator_tasks
    where task_type = 'fix'
      and metadata ->> 'exception_type' = 'application_remediation'
      and metadata ->> 'application_id' = new.subject_id::text
      and status in ('queued', 'running')
    order by created_at desc
    limit 1;

    if existing_task_id is null then
      missing_items := coalesce(new.detected_condition ->> 'missingDocuments', '[]');
      insert into public.operator_tasks (
        workspace_id,
        task_type,
        status,
        prompt,
        metadata
      ) values (
        null,
        'fix',
        'queued',
        format(
          'Application %s requires staff review. Missing requirements: %s. Attempts: %s/%s. Reason: %s',
          new.subject_id,
          missing_items,
          new.attempt_count,
          new.max_attempts,
          coalesce(new.failure_reason, 'closed-loop remediation escalation')
        ),
        jsonb_build_object(
          'exception_type', 'application_remediation',
          'application_id', new.subject_id,
          'workflow_key', new.workflow_key,
          'followup_id', new.id,
          'attempt_count', new.attempt_count,
          'max_attempts', new.max_attempts,
          'failure_reason', new.failure_reason,
          'missing_documents', coalesce(new.detected_condition -> 'missingDocuments', '[]'::jsonb),
          'autopilot', true
        )
      ) returning id into existing_task_id;
    end if;

    if new.escalation_status = 'needed' then
      new.escalation_status := 'created';
      new.audit_metadata := coalesce(new.audit_metadata, '{}'::jsonb)
        || jsonb_build_object('operator_task_id', existing_task_id);
    end if;
  elsif new.state = 'resolved' then
    update public.operator_tasks
    set status = 'completed',
        result_summary = coalesce(result_summary, 'Closed automatically after required documents were satisfied.'),
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    where task_type = 'fix'
      and metadata ->> 'exception_type' = 'application_remediation'
      and metadata ->> 'application_id' = new.subject_id::text
      and status in ('queued', 'running');

    if new.escalation_status = 'created' then
      new.escalation_status := 'closed';
    end if;
  end if;

  return new;
end;
$$;
