-- Independent certifying-program infrastructure. No EPA approval or official questions are seeded.
create schema if not exists testing_private;
revoke all on schema testing_private from public, anon, authenticated;
grant usage on schema testing_private to service_role;

create table public.epa_certification_authority (
 id text primary key check(id='elevate'), legal_name text not null,
 status text not null default 'pending' check(status in ('pending','approved','suspended')),
 approved_at date, approval_evidence_key text, allowed_delivery text[] not null default '{in_person}',
 check(status <> 'approved' or (approved_at is not null and length(approval_evidence_key)>0))
);
insert into public.epa_certification_authority(id,legal_name) values ('elevate','Elevate for Humanity');
create table public.epa_proctor_registrations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 site_name text not null, site_address text not null, status text not null default 'pending' check(status in ('pending','active','suspended')),
 training_verified_at timestamptz, approved_by uuid references public.profiles(id), approved_at timestamptz,
 created_at timestamptz not null default now(), unique(user_id,site_name),
 check(status <> 'active' or (training_verified_at is not null and approved_by is not null and approved_at is not null))
);
create index epa_proctor_user_idx on public.epa_proctor_registrations(user_id);
create table testing_private.epa_questions (
 id uuid primary key default gen_random_uuid(), bank_version text not null, source_reference text not null,
 section text not null check(section in ('core','type_i','type_ii','type_iii')),
 prompt text not null, choices jsonb not null check(jsonb_typeof(choices)='array' and jsonb_array_length(choices)>=2),
 correct_index integer not null check(correct_index>=0), active boolean not null default true,
 check(correct_index<jsonb_array_length(choices)), unique(bank_version,source_reference)
);
create table public.epa_native_attempts (
 id uuid primary key default gen_random_uuid(), session_id uuid not null unique references public.exam_sessions(id),
 candidate_id uuid not null references public.profiles(id), proctor_registration_id uuid not null references public.epa_proctor_registrations(id),
 exam_type text not null check(exam_type in ('type_i','type_ii','type_iii','universal')),
 bank_version text not null, candidate_name text not null, candidate_address text not null, candidate_city text not null,
 site_name text not null, site_address text not null, directory_opt_out boolean not null default true,
 started_at timestamptz not null default now(), expires_at timestamptz not null,
 submitted_at timestamptz, section_results jsonb, passed boolean, certificate_number text unique, certificate_issued_at timestamptz
);
create index epa_attempt_candidate_idx on public.epa_native_attempts(candidate_id);
create index epa_attempt_report_idx on public.epa_native_attempts(submitted_at);
create index epa_attempt_proctor_idx on public.epa_native_attempts(proctor_registration_id);
create table testing_private.epa_attempt_items (
 attempt_id uuid not null references public.epa_native_attempts(id), position integer not null,
 question_id uuid not null references testing_private.epa_questions(id), section text not null,
 prompt text not null, choices jsonb not null, correct_index integer not null, answer_index integer,
 primary key(attempt_id,position), unique(attempt_id,question_id)
);
alter table public.epa_certification_authority enable row level security;
alter table public.epa_proctor_registrations enable row level security;
alter table public.epa_native_attempts enable row level security;
alter table testing_private.epa_questions enable row level security;
alter table testing_private.epa_attempt_items enable row level security;
revoke all on public.epa_certification_authority,public.epa_proctor_registrations,public.epa_native_attempts from public,anon,authenticated;
grant all on public.epa_certification_authority,public.epa_proctor_registrations,public.epa_native_attempts to service_role;
grant all on all tables in schema testing_private to service_role;

-- All session mutations now create audit evidence atomically, including browser-originated vendor records.
create function testing_private.audit_exam_session() returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid := coalesce(auth.uid(),nullif(current_setting('app.exam_actor',true),'')::uuid); event text;
begin
 event := case when tg_op='INSERT' then 'session_created' else 'session_updated' end;
 insert into public.exam_session_events(session_id,event_type,actor_id,actor_role,metadata)
 values(new.id,event,actor,coalesce(auth.role(),'database'),jsonb_build_object(
  'status',new.status,'result',new.result,'score',new.score,'id_verified',new.id_verified,
  'proctor_id',new.proctor_id,'evidence_hash',new.evidence_hash,
  'previous',case when tg_op='UPDATE' then jsonb_build_object('status',old.status,'result',old.result,'score',old.score,'id_verified',old.id_verified) else null end));
 return new;
end $$;
revoke all on function testing_private.audit_exam_session() from public,anon,authenticated;
create trigger native_exam_session_audit after insert or update on public.exam_sessions for each row execute function testing_private.audit_exam_session();
create function testing_private.retain_exam_evidence() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Exam records are permanent; void or invalidate the session instead'; end $$;
revoke all on function testing_private.retain_exam_evidence() from public,anon,authenticated;
create trigger retain_exam_sessions before delete on public.exam_sessions for each row execute function testing_private.retain_exam_evidence();
create trigger retain_exam_session_events before update or delete on public.exam_session_events for each row execute function testing_private.retain_exam_evidence();
create trigger retain_exam_events before update or delete on public.exam_events for each row execute function testing_private.retain_exam_evidence();
-- Deny direct event fabrication; authoritative session transitions use the database trigger.
revoke insert,update,delete on public.exam_session_events from anon,authenticated;
revoke insert,update,delete on public.exam_events from anon,authenticated;

create function public.epa_start_native_exam(p_actor uuid,p_session uuid,p_exam_type text,p_bank_version text,p_candidate_address text,p_candidate_city text,p_opt_out boolean default true)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.exam_sessions; r public.epa_proctor_registrations; a public.epa_certification_authority;
 attempt uuid; section_key text; sections text[]; question_count int; payload jsonb;
begin
 select * into a from public.epa_certification_authority where id='elevate';
 if a.status is distinct from 'approved' or a.approved_at>current_date then raise exception 'EPA approval is required before official exam delivery'; end if;
 if p_exam_type not in ('type_i','type_ii','type_iii','universal') then raise exception 'Invalid exam type'; end if;
 select * into s from public.exam_sessions where id=p_session for update;
 if not found or s.proctor_id is distinct from p_actor or s.student_id is null or s.student_id=p_actor then raise exception 'Assigned proctor and separate candidate required'; end if;
 if not exists(select 1 from public.profiles where id=p_actor and is_active is distinct from false and suspended is distinct from true) then raise exception 'Inactive proctor'; end if;
 if not exists(select 1 from public.profiles where id=s.student_id and is_active is distinct from false and suspended is distinct from true) then raise exception 'Inactive candidate'; end if;
 select * into r from public.epa_proctor_registrations where user_id=p_actor and status='active' order by approved_at desc limit 1;
 if not found then raise exception 'Active proctor registration required'; end if;
 if (select count(*) from public.exam_sessions where proctor_id=p_actor and status::text='in_progress')>=50 then raise exception 'Proctor concurrent candidate limit reached'; end if;
 if not s.id_verified or s.id_type is null or s.status::text<>'checked_in' then raise exception 'Verified ID and checked-in session required'; end if;
 if not (s.delivery_method=any(a.allowed_delivery)) then raise exception 'Delivery method not approved'; end if;
 if length(trim(p_candidate_address))<5 or length(trim(p_candidate_city))<2 then raise exception 'Candidate address and city required'; end if;
 sections := case when p_exam_type='universal' then array['core','type_i','type_ii','type_iii'] else array['core',p_exam_type] end;
 foreach section_key in array sections loop
  select count(*) into question_count from testing_private.epa_questions where bank_version=p_bank_version and section=section_key and active;
  if question_count<26 then raise exception 'Insufficient authorized questions in section %',section_key; end if;
 end loop;
 perform set_config('app.exam_actor',p_actor::text,true);
 insert into public.epa_native_attempts(session_id,candidate_id,proctor_registration_id,exam_type,bank_version,candidate_name,candidate_address,candidate_city,site_name,site_address,directory_opt_out,expires_at)
 values(s.id,s.student_id,r.id,p_exam_type,p_bank_version,s.student_name,p_candidate_address,p_candidate_city,r.site_name,r.site_address,coalesce(p_opt_out,true),now()+make_interval(mins=>greatest(1,least(coalesce(s.duration_min,180),240)))) returning id into attempt;
 insert into testing_private.epa_attempt_items(attempt_id,position,question_id,section,prompt,choices,correct_index)
 select attempt,row_number() over(order by array_position(sections,q.section),q.random_order)::int,q.id,q.section,q.prompt,q.choices,q.correct_index
 from (select picked.*,random() as random_order from unnest(sections) as wanted(section) cross join lateral
  (select * from testing_private.epa_questions where section=wanted.section and bank_version=p_bank_version and active order by random() limit 25) picked) q;
 update public.exam_sessions set status='in_progress',started_at=now(),provider='other',exam_name='Elevate EPA 608 — '||p_exam_type where id=s.id;
 return jsonb_build_object('attemptId',attempt,'sessionId',s.id,'candidateId',s.student_id);
end $$;

create function public.epa_native_exam_payload(p_actor uuid,p_attempt uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.epa_native_attempts; s public.exam_sessions;
begin
 select * into a from public.epa_native_attempts where id=p_attempt;
 if not found or a.candidate_id is distinct from p_actor then raise exception 'Candidate access required'; end if;
 if not exists(select 1 from public.profiles where id=p_actor and is_active is distinct from false and suspended is distinct from true) then raise exception 'Inactive candidate'; end if;
 select * into s from public.exam_sessions where id=a.session_id;
 if s.status::text='voided' or s.review_status='invalidated' then raise exception 'Exam invalidated'; end if;
 return jsonb_build_object('id',a.id,'sessionId',a.session_id,'examType',a.exam_type,'expiresAt',a.expires_at,'submittedAt',a.submitted_at,'passed',a.passed,'sections',a.section_results,
 'questions',case when a.submitted_at is null and now()<=a.expires_at then (select jsonb_agg(jsonb_build_object('position',position,'section',section,'prompt',prompt,'choices',choices) order by position) from testing_private.epa_attempt_items where attempt_id=a.id) else '[]'::jsonb end);
end $$;

create function public.epa_submit_native_exam(p_actor uuid,p_attempt uuid,p_answers jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.epa_native_attempts; s public.exam_sessions; results jsonb; all_passed boolean;
begin
 select * into a from public.epa_native_attempts where id=p_attempt for update;
 if not found or a.candidate_id is distinct from p_actor then raise exception 'Candidate access required'; end if;
 select * into s from public.exam_sessions where id=a.session_id for update;
 if not exists(select 1 from public.profiles where id=p_actor and is_active is distinct from false and suspended is distinct from true) then raise exception 'Inactive candidate'; end if;
 if s.status::text='voided' or s.review_status='invalidated' then raise exception 'Exam invalidated'; end if;
 if a.submitted_at is not null then return jsonb_build_object('passed',a.passed,'sections',a.section_results); end if;
 if s.status::text<>'in_progress' then raise exception 'Exam is not in progress'; end if;
 -- Late answers are discarded. Expired attempts are finalized as failed, never left reusable.
 if now()>a.expires_at then p_answers:='[]'::jsonb; end if;
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)>100 then raise exception 'Invalid answers'; end if;
 if exists(select 1 from jsonb_array_elements(p_answers) x group by x->>'position' having count(*)>1) then raise exception 'Duplicate answer position'; end if;
 if exists(select 1 from jsonb_array_elements(p_answers) x where not exists(select 1 from testing_private.epa_attempt_items i where i.attempt_id=a.id and i.position=(x->>'position')::int and (x->>'answer')::int>=0 and (x->>'answer')::int<jsonb_array_length(i.choices))) then raise exception 'Unknown question or invalid answer'; end if;
 update testing_private.epa_attempt_items i set answer_index=(x->>'answer')::int from jsonb_array_elements(p_answers) x where i.attempt_id=a.id and i.position=(x->>'position')::int;
 select jsonb_object_agg(section,jsonb_build_object('correct',correct,'total',total,'passed',correct*100>=total*70)),bool_and(total=25 and correct*100>=total*70)
 into results,all_passed from (select section,count(*) total,count(*) filter(where answer_index=correct_index) correct from testing_private.epa_attempt_items where attempt_id=a.id group by section) scores;
 if results is null then raise exception 'Exam questions missing'; end if;
 perform set_config('app.exam_actor',p_actor::text,true);
 perform set_config('app.epa_grading','true',true);
 update public.epa_native_attempts set submitted_at=now(),section_results=results,passed=all_passed where id=a.id;
 update public.exam_sessions set status='completed',completed_at=now(),result=case when all_passed then 'pass'::public.exam_result else 'fail'::public.exam_result end,
 score=(select count(*) filter(where answer_index=correct_index)*100.0/count(*) from testing_private.epa_attempt_items where attempt_id=a.id) where id=s.id;
 return jsonb_build_object('passed',all_passed,'sections',results);
end $$;

create function public.epa_issue_native_certificate(p_actor uuid,p_attempt uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.epa_native_attempts; s public.exam_sessions; authority public.epa_certification_authority;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role in ('admin','super_admin','test_admin') and is_active is distinct from false and suspended is distinct from true) then raise exception 'Certification administrator required'; end if;
 select * into a from public.epa_native_attempts where id=p_attempt for update;
 if not found then raise exception 'Attempt not found'; end if;
 select * into s from public.exam_sessions where id=a.session_id for update;
 if not exists(select 1 from public.profiles where id=p_actor and (role in ('admin','super_admin') or tenant_id=s.tenant_id)) then raise exception 'Certification scope denied'; end if;
 select * into authority from public.epa_certification_authority where id='elevate';
 if authority.status is distinct from 'approved' or a.passed is distinct from true or s.status::text<>'completed' or s.result::text<>'pass' or s.review_status<>'clear' then raise exception 'Approval, verified passing exam, and clear review required'; end if;
 if a.certificate_number is null then
  update public.epa_native_attempts set certificate_issued_at=now(),certificate_number='EFH-608-'||upper(replace(gen_random_uuid()::text,'-','')) where id=a.id returning * into a;
  insert into public.exam_session_events(session_id,event_type,actor_id,actor_role,metadata) values(s.id,'certificate_issued',p_actor,'certification_admin',jsonb_build_object('certificate_number',a.certificate_number));
 end if;
 return jsonb_build_object('certificateNumber',a.certificate_number,'candidateName',a.candidate_name,'examType',a.exam_type,'issuedAt',a.certificate_issued_at,'approvalDate',authority.approved_at,'issuer',authority.legal_name);
end $$;
revoke all on function public.epa_start_native_exam(uuid,uuid,text,text,text,text,boolean), public.epa_native_exam_payload(uuid,uuid),public.epa_submit_native_exam(uuid,uuid,jsonb),public.epa_issue_native_certificate(uuid,uuid) from public,anon,authenticated;
grant execute on function public.epa_start_native_exam(uuid,uuid,text,text,text,text,boolean), public.epa_native_exam_payload(uuid,uuid),public.epa_submit_native_exam(uuid,uuid,jsonb),public.epa_issue_native_certificate(uuid,uuid) to service_role;

-- Manual result entry cannot overwrite native, machine-scored attempts.
create function testing_private.protect_native_exam_result() returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select 1 from public.epa_native_attempts where session_id=old.id) and
 (new.score is distinct from old.score or new.result is distinct from old.result or new.student_id is distinct from old.student_id or new.proctor_id is distinct from old.proctor_id or new.student_name is distinct from old.student_name or new.tenant_id is distinct from old.tenant_id)
 and coalesce(current_setting('app.epa_grading',true),'')<>'true' then raise exception 'Native exam results can only be changed by atomic scoring'; end if;
 return new;
end $$;
revoke all on function testing_private.protect_native_exam_result() from public,anon,authenticated;
-- Invoker trigger must read protected attempts for browser updates: use definer only for this narrow guard.
alter function testing_private.protect_native_exam_result() security definer;
create trigger protect_native_exam_result before update on public.exam_sessions for each row execute function testing_private.protect_native_exam_result();
-- Submit is service-role only and owns the same transaction's grading flag.
-- The flag is set inside the submission function below, never by a separate PostgREST request.

create function public.epa_import_question_bank(p_actor uuid,p_version text,p_questions jsonb) returns integer language plpgsql security invoker set search_path='' as $$
declare imported int;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role in ('admin','super_admin') and is_active is distinct from false and suspended is distinct from true) then raise exception 'Platform administrator required'; end if;
 if not exists(select 1 from public.epa_certification_authority where id='elevate' and status='approved') then raise exception 'EPA approval and authorized bank access required'; end if;
 if length(trim(p_version))<1 or jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions)>2000 then raise exception 'Invalid bank import'; end if;
 if exists(select 1 from jsonb_array_elements(p_questions) q where length(trim(coalesce(q->>'sourceReference','')))<1 or length(trim(coalesce(q->>'prompt','')))<1) then raise exception 'Official source reference and prompt required'; end if;
 -- Versions are immutable once used; corrections require a new version.
 if exists(select 1 from public.epa_native_attempts where bank_version=p_version) then raise exception 'Used bank version is immutable'; end if;
 insert into testing_private.epa_questions(bank_version,source_reference,section,prompt,choices,correct_index)
 select p_version,q->>'sourceReference',q->>'section',q->>'prompt',q->'choices',(q->>'correctIndex')::int from jsonb_array_elements(p_questions) q;
 get diagnostics imported=row_count;
 return imported;
end $$;
create function public.epa_native_readiness() returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object('authority',(select to_jsonb(a) from public.epa_certification_authority a where id='elevate'),
 'banks',(select coalesce(jsonb_agg(b),'[]'::jsonb) from (select bank_version,section,count(*) as questions from testing_private.epa_questions where active group by bank_version,section) b),
 'proctors',(select coalesce(jsonb_agg(r),'[]'::jsonb) from public.epa_proctor_registrations r));
$$;
revoke all on function public.epa_import_question_bank(uuid,text,jsonb),public.epa_native_readiness() from public,anon,authenticated;
grant execute on function public.epa_import_question_bank(uuid,text,jsonb),public.epa_native_readiness() to service_role;

-- Private recordings are served only by an authorized short-lived signed URL.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('exam-evidence','exam-evidence',false,104857600,array['video/webm','video/mp4'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- A single statement provides a consistent report snapshot across all records.
create function public.epa_native_activity_report(p_start timestamptz,p_end timestamptz) returns jsonb language sql security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('exam_type',t.exam_type,
 'attempts',(select count(*) from public.epa_native_attempts a where a.exam_type=t.exam_type and a.submitted_at>=p_start and a.submitted_at<p_end),
 'passed',(select count(*) from public.epa_native_attempts a where a.exam_type=t.exam_type and a.submitted_at>=p_start and a.submitted_at<p_end and a.passed),
 'failed',(select count(*) from public.epa_native_attempts a where a.exam_type=t.exam_type and a.submitted_at>=p_start and a.submitted_at<p_end and not a.passed),
 'certified',(select count(*) from public.epa_native_attempts a where a.exam_type=t.exam_type and a.certificate_issued_at>=p_start and a.certificate_issued_at<p_end and a.certificate_number is not null))),'[]'::jsonb)
 from unnest(array['type_i','type_ii','type_iii','universal']) t(exam_type);
$$;
revoke all on function public.epa_native_activity_report(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.epa_native_activity_report(timestamptz,timestamptz) to service_role;

-- No cross-tenant edits, including through legacy permissive policies.
create policy exam_sessions_scope_guard on public.exam_sessions as restrictive for all to authenticated
 using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.suspended is distinct from true and
 (p.role in ('admin','super_admin') or (p.tenant_id=exam_sessions.tenant_id and p.role in ('staff','test_admin','instructor')) or (p.id=exam_sessions.proctor_id and p.role='proctor'))))
 with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.suspended is distinct from true and
 (p.role in ('admin','super_admin') or (p.tenant_id=exam_sessions.tenant_id and p.role in ('staff','test_admin','instructor')) or (p.id=exam_sessions.proctor_id and p.role='proctor'))));
create policy assigned_proctor_sessions on public.exam_sessions for all to authenticated
 using (proctor_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('proctor','test_admin')))
 with check (proctor_id=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('proctor','test_admin')));

create policy session_event_scope_guard on public.exam_session_events as restrictive for select to authenticated
 using(exists(select 1 from public.exam_sessions s where s.id=exam_session_events.session_id));
create policy monitoring_event_scope_guard on public.exam_events as restrictive for select to authenticated
 using(exists(select 1 from public.exam_sessions s where s.id=exam_events.exam_session_id));

create function public.attach_private_exam_evidence(p_actor uuid,p_session uuid,p_key text,p_hash text) returns boolean language plpgsql security invoker set search_path='' as $$
declare s public.exam_sessions; p public.profiles;
begin
 select * into s from public.exam_sessions where id=p_session for update;
 if not found or s.evidence_storage_key is not null then raise exception 'Exam unavailable or evidence already attached'; end if;
 select * into p from public.profiles where id=p_actor;
 if not found or p.is_active is false or p.suspended is true then raise exception 'Active account required'; end if;
 if p.role not in ('admin','super_admin') and p_actor is distinct from s.student_id and not(coalesce(p_actor=s.proctor_id and p.role in ('proctor','test_admin','staff','instructor'),false)) and not(coalesce(p.tenant_id=s.tenant_id and p.role in ('staff','test_admin'),false)) then raise exception 'Exam access denied'; end if;
 if p_key not like 'exam-evidence/'||p_session::text||'/%' or p_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid private evidence'; end if;
 perform set_config('app.exam_actor',p_actor::text,true);
 update public.exam_sessions set evidence_storage_key=p_key,evidence_hash=p_hash,evidence_uploaded_at=now(),
 recording_url='/api/exams/evidence?sessionId='||p_session::text,evidence_url='/api/exams/evidence?sessionId='||p_session::text where id=p_session;
 return true;
end $$;
revoke all on function public.attach_private_exam_evidence(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.attach_private_exam_evidence(uuid,uuid,text,text) to service_role;

create table testing_private.epa_program_events (
 id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),
 actor_id uuid,entity_type text not null,entity_id text not null,before_state jsonb,after_state jsonb
);
alter table testing_private.epa_program_events enable row level security;
grant all on testing_private.epa_program_events to service_role;
create function testing_private.audit_epa_program_configuration() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into testing_private.epa_program_events(actor_id,entity_type,entity_id,before_state,after_state)
 values(auth.uid(),tg_table_name,new.id::text,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 return new;
end $$;
revoke all on function testing_private.audit_epa_program_configuration() from public,anon,authenticated;
create trigger audit_epa_authority after insert or update on public.epa_certification_authority for each row execute function testing_private.audit_epa_program_configuration();
create trigger audit_epa_proctors after insert or update on public.epa_proctor_registrations for each row execute function testing_private.audit_epa_program_configuration();
create trigger retain_epa_program_events before update or delete on testing_private.epa_program_events for each row execute function testing_private.retain_exam_evidence();
create trigger retain_epa_native_attempts before delete on public.epa_native_attempts for each row execute function testing_private.retain_exam_evidence();
create trigger retain_epa_proctors before delete on public.epa_proctor_registrations for each row execute function testing_private.retain_exam_evidence();
