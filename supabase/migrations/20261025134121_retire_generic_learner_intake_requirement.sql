-- Retire only the generic learner intake upload; retain all evidence/history.
update public.document_requirements set is_required=false,required=false,updated_at=now()
where role='student' and program_id is null and document_type='program'
and lower(btrim(name))='learner intake confirmation';
update public.enrollment_requirements set status='not_applicable',updated_at=now()
where requirement_type='program' and lower(btrim(title))='learner intake confirmation';
create or replace function public.retire_generic_learner_intake_requirement()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.requirement_type='program' and lower(btrim(new.title))='learner intake confirmation' then
  new.status := 'not_applicable';
 end if;
 return new;
end $$;
revoke all on function public.retire_generic_learner_intake_requirement() from public,anon,authenticated;
create trigger retire_generic_learner_intake_requirement
before insert or update of title,requirement_type,status on public.enrollment_requirements
for each row execute function public.retire_generic_learner_intake_requirement();
insert into public.audit_logs(action,target_type,metadata,created_at)
values ('generic_learner_intake_requirement_retired','document_requirement',
'{"reason":"Owner requested removal for everyone","policy":"Generic learner intake confirmation only; preserve evidence and program-specific requirements"}'::jsonb,now());