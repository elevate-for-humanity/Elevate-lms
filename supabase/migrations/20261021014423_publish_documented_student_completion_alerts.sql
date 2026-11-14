create or replace function public.publish_student_completion_alerts(p_today date default (now() at time zone 'America/New_York')::date)
returns integer language plpgsql security definer set search_path=pg_catalog,public as $fn$
declare inserted_count integer;
begin
 with students as (
 select e.id,e.user_id,e.student_id,e.program_holder_id,e.program_id,e.tenant_id,e.full_name,e.status,
 coalesce(e.expected_end_date,e.training_end_date) as expected_date,e.completion_date,e.completed_at
 from public.program_enrollments e
 where e.revoked_at is null and e.status in ('active','enrolled','in_progress','completed','graduated')
 and (exists(select 1 from public.ita_vouchers v where v.enrollment_id=e.id)
 or exists(select 1 from public.enrollment_funding_records f where f.enrollment_id=e.id and f.status in ('approved','disbursed','reconciled')))
 and not exists(select 1 from public.profiles p where p.id=coalesce(e.user_id,e.student_id) and lower(coalesce(p.email,'')) like '%@qa.invalid')
 ), tasks as (
 select s.*,a.kind,a.message from students s cross join lateral (
 select case when s.completion_date is not null or s.completed_at is not null then null
 when s.status in ('completed','graduated') then 'missing_actual_date'
 when s.expected_date is null then 'missing_expected_date'
 when s.expected_date<p_today then 'overdue'
 when s.expected_date=p_today then 'due_today'
 when s.expected_date<=p_today+7 then 'due_7'
 when s.expected_date<=p_today+14 then 'due_14'
 when s.expected_date<=p_today+30 then 'due_30' end as kind,
 case when s.status in ('completed','graduated') then 'Actual completion date needs supporting documentation.'
 when s.expected_date is null then 'Expected completion date needs documentation.'
 when s.expected_date<p_today then 'Expected completion is overdue. Confirm progress; completion has not been inferred.'
 when s.expected_date=p_today then 'Training completion is due today.'
 when s.expected_date<=p_today+7 then 'Training completion is due within 7 days.'
 when s.expected_date<=p_today+14 then 'Training completion is due within 14 days.'
 else 'Training completion is due within 30 days.' end as message
 union all select 'missing_certification','Certificate evidence has not been uploaded and approved. Submit any earned credential for review.'
 where (s.expected_date<=p_today or s.status in ('completed','graduated')) and not exists(select 1 from public.student_credential_uploads c where c.user_id=coalesce(s.user_id,s.student_id) and c.program_id=s.program_id and c.verification_status='approved')
 union all select 'missing_resume','Resume is missing. Build or upload a resume in Career Services.'
 where not exists(select 1 from public.resumes r where r.user_id=coalesce(s.user_id,s.student_id))
 and not exists(select 1 from public.documents d where d.user_id=coalesce(s.user_id,s.student_id) and d.metadata->>'original_type'='resume')
 union all select 'career_not_started','Career Services has not been started. Open career readiness onboarding.'
 where not exists(select 1 from public.resume_profiles r where r.user_id=coalesce(s.user_id,s.student_id))
 ) a where a.kind is not null
 ), deliveries as (
 select t.*,recipient.user_id as recipient_id,recipient.portal from tasks t cross join lateral (
 select distinct on (r.user_id) r.user_id,r.portal from (
 select p.id as user_id,'admin'::text as portal,1 as priority from public.profiles p
 where p.role in ('admin','super_admin','staff') and lower(coalesce(p.email,'')) not like '%@qa.invalid'
 union all select p.id,'holder',2 from public.profiles p join public.program_holders h on h.id=t.program_holder_id
 where h.status in ('approved','active','approved_pending_mou') and h.approved_at is not null
 and (p.id=h.user_id or (p.program_holder_id=h.id and p.role in ('program_holder','programholder','site_coordinator')))
 and lower(coalesce(p.email,'')) not like '%@qa.invalid'
 union all select p.id,'student',3 from public.profiles p where p.id=coalesce(t.user_id,t.student_id)
 and lower(coalesce(p.email,'')) not like '%@qa.invalid'
 ) r order by r.user_id,r.priority
 ) recipient
 ), saved as (
 insert into public.notifications(user_id,tenant_id,type,title,message,action_url,idempotency_key,metadata)
 select recipient_id,tenant_id,'reminder','Student training: '||coalesce(full_name,'Student'),
 message||case when expected_date is not null then ' Expected completion: '||expected_date::text||'.' else '' end,
 case portal when 'admin' then 'https://admin.elevateforhumanity.org/funding/reconciliation'
 when 'holder' then 'https://app.elevateforhumanity.org/program-holder/students'
 else 'https://app.elevateforhumanity.org/lms/dashboard' end,
 'student-completion:'||id::text||':'||coalesce(expected_date::text,'undocumented')||':'||kind||':'||recipient_id::text,
 jsonb_build_object('alert_kind',kind,'enrollment_id',id,'expected_completion_date',expected_date,'recipient_portal',portal)
 from deliveries on conflict(idempotency_key) do nothing returning id
 ) select count(*) into inserted_count from saved;
 return inserted_count;
end $fn$;
revoke all on function public.publish_student_completion_alerts(date) from public,anon,authenticated;
grant execute on function public.publish_student_completion_alerts(date) to service_role;
