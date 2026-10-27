select cron.schedule('student-completion-alerts','0 13 * * *','select public.publish_student_completion_alerts();');
insert into public.audit_logs(action,actor_type,target_type,target_id,metadata)
select 'student_completion_alerts_configured','automation','cron.job',jobid::text,
jsonb_build_object('schedule',schedule,'timezone','UTC','calendar_timezone','America/New_York','delivery','in_app','idempotent',true)
from cron.job where jobname='student-completion-alerts'
and not exists(select 1 from public.audit_logs where action='student_completion_alerts_configured' and target_id=cron.job.jobid::text);
