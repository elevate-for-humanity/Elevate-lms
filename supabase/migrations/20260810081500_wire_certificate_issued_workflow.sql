do $$
declare
  v_workflow_id uuid;
begin
  select id into v_workflow_id from public.workflows where workflow_key='cert_issued' limit 1;
  if v_workflow_id is null then
    raise exception 'Certificate workflow not found';
  end if;

  delete from public.workflow_triggers where workflow_id=v_workflow_id and trigger_type='event';
  delete from public.workflow_steps where workflow_id=v_workflow_id;

  insert into public.workflow_triggers(workflow_id,trigger_type,event_filter,enabled)
  values (v_workflow_id,'event',jsonb_build_object('event_type','certificate.issued','subject_type','certificate'),true);

  insert into public.workflow_steps(workflow_id,step_order,action_type,action_config,is_condition,enabled)
  values (
    v_workflow_id,
    1,
    'send_email',
    jsonb_build_object(
      'to','{{student_email}}',
      'subject','Your Elevate certificate is ready',
      'html','<h2>Congratulations {{student_name}}</h2><p>Your certificate for <strong>{{course_title}}</strong> has been issued.</p><p>Certificate number: <strong>{{certificate_number}}</strong></p><p><a href="{{verification_url}}">Verify your certificate</a></p>'
    ),
    false,
    true
  );
end $$;
