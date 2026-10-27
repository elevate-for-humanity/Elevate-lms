alter table public.student_credential_uploads add column if not exists credential_earned_date date;
create or replace function public.review_student_credential_document(p_upload_id uuid, p_actor_id uuid, p_decision text, p_earned_date date default null, p_reason text default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $fn$
declare previous public.student_credential_uploads%rowtype; reviewed public.student_credential_uploads%rowtype;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and role in ('admin','super_admin','staff','org_admin')) then raise exception 'Authorized reviewer required' using errcode='42501'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'Invalid review decision' using errcode='22023'; end if;
 if p_decision='approved' and (p_earned_date is null or p_earned_date>(now() at time zone 'America/New_York')::date) then raise exception 'Documented earned date required' using errcode='22023'; end if;
 if p_decision='rejected' and nullif(btrim(p_reason),'') is null then raise exception 'Rejection reason required' using errcode='22023'; end if;
 select * into previous from public.student_credential_uploads where id=p_upload_id for update;
 if not found then raise exception 'Upload not found' using errcode='P0002'; end if;
 if previous.verification_status<>'pending' then raise exception 'Document already reviewed; reload the record' using errcode='40001'; end if;
 update public.student_credential_uploads set verification_status=p_decision, verified_by=p_actor_id, verified_at=now(), credential_earned_date=case when p_decision='approved' then p_earned_date else null end, rejection_reason=case when p_decision='rejected' then btrim(p_reason) else null end, updated_at=now() where id=p_upload_id returning * into reviewed;
 insert into public.audit_logs(action,actor_type,actor_id,target_type,target_id,before_state,after_state,metadata)
 values ('credential_document_reviewed','admin',p_actor_id,'student_credential_uploads',p_upload_id::text,
 jsonb_build_object('verification_status',previous.verification_status),
 jsonb_build_object('verification_status',reviewed.verification_status,'credential_earned_date',reviewed.credential_earned_date,'rejection_reason',reviewed.rejection_reason),
 jsonb_build_object('program_id',reviewed.program_id,'verified_at',reviewed.verified_at));
 return jsonb_build_object('id',reviewed.id,'verification_status',reviewed.verification_status,'credential_earned_date',reviewed.credential_earned_date,'verified_at',reviewed.verified_at);
end $fn$;
revoke all on function public.review_student_credential_document(uuid,uuid,text,date,text) from public,anon,authenticated;
grant execute on function public.review_student_credential_document(uuid,uuid,text,date,text) to service_role;
