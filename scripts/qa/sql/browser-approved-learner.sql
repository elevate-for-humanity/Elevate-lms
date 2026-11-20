-- Isolated elevate-lms-qa only. Do not update existing enrollment records.
do $qa$
declare learner record; approver uuid; program uuid;
begin
 select p.id,p.tenant_id into strict learner from public.profiles p join public.tenants t on t.id=p.tenant_id where p.role='student' and t.slug='elevate-lms-qa';
 select p.id into strict approver from public.profiles p where p.tenant_id=learner.tenant_id and p.role in ('admin','super_admin');
 select p.id into strict program from public.programs p where p.slug='hvac-technician' and p.tenant_id=learner.tenant_id;
 insert into public.program_enrollments(user_id,program_id,program_slug,tenant_id,status,payment_status,approved_at,approved_by,access_granted_at,access_status)
 select learner.id,program,'hvac-technician',learner.tenant_id,'active','paid',now(),approver,now(),'active'
 where not exists (select 1 from public.program_enrollments e where e.user_id=learner.id or e.student_id=learner.id);
end
$qa$;
select count(*) approved_paid_synthetic_enrollments from public.program_enrollments e join public.tenants t on t.id=e.tenant_id where t.slug='elevate-lms-qa' and e.program_slug='hvac-technician' and e.status='active' and e.payment_status='paid' and e.approved_by is not null and e.access_granted_at is not null and e.access_status='active';
