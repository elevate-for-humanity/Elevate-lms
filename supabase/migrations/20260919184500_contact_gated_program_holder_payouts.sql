-- Require documented applicant contact before Program Holder payout eligibility.
alter table public.program_holder_students
  add column if not exists payout_contact_verified_at timestamptz,
  add column if not exists payout_contact_verified_by uuid,
  add column if not exists payout_contact_call_log_id uuid;

create or replace function public.program_holder_contact_verified(p_program_holder_student_id uuid,p_program_holder_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.program_holder_call_log c
 where c.program_holder_student_id=p_program_holder_student_id and c.program_holder_id=p_program_holder_id
 and c.called_at is not null and nullif(btrim(coalesce(c.outcome,'')),'') is not null);
$$;

create or replace function public.enforce_program_holder_contact_before_payout()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if lower(coalesce(new.expected_payout_status,'')) in ('eligible','paid')
 and not public.program_holder_contact_verified(new.id,new.program_holder_id) then
  raise exception 'Payout blocked: a documented call with an outcome by the assigned Program Holder is required for this applicant.';
 end if;
 return new;
end; $$;

drop trigger if exists trg_program_holder_contact_before_payout on public.program_holder_students;
create trigger trg_program_holder_contact_before_payout before insert or update of expected_payout_status
on public.program_holder_students for each row execute function public.enforce_program_holder_contact_before_payout();

create or replace function public.mark_program_holder_contact_verified()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.called_at is not null and nullif(btrim(coalesce(new.outcome,'')),'') is not null then
  update public.program_holder_students set call_date=new.called_at,call_outcome=new.outcome,
   call_notes=coalesce(new.notes,call_notes),called_by=coalesce(new.called_by_user_id::text,called_by),
   payout_contact_verified_at=new.called_at,payout_contact_verified_by=new.called_by_user_id,
   payout_contact_call_log_id=new.id,updated_at=now()
  where id=new.program_holder_student_id and program_holder_id=new.program_holder_id;
 end if;
 return new;
end; $$;

drop trigger if exists trg_mark_program_holder_contact_verified on public.program_holder_call_log;
create trigger trg_mark_program_holder_contact_verified after insert or update of called_at,outcome
on public.program_holder_call_log for each row execute function public.mark_program_holder_contact_verified();

create or replace view public.program_holder_uncontacted_alerts with (security_invoker=true) as
select s.id program_holder_student_id,s.program_holder_id,h.organization_name,h.contact_name,h.contact_email,
 s.application_id,s.applicant_name,s.applicant_email,s.applicant_phone,s.created_at,
 extract(day from now()-s.created_at)::int days_waiting
from public.program_holder_students s join public.program_holders h on h.id=s.program_holder_id
where s.created_at<=now()-interval '5 days'
and not public.program_holder_contact_verified(s.id,s.program_holder_id)
and lower(coalesce(s.status,'')) not in ('completed','cancelled','withdrawn');

create or replace function public.raise_program_holder_uncontacted_alerts()
returns integer language plpgsql security definer set search_path=public as $$
declare inserted_count integer;
begin
 insert into public.staff_notifications(type,title,message,severity,metadata)
 select 'program_holder_applicant_uncontacted_5_days','Applicant not contacted within 5 days',
 coalesce(u.applicant_name,u.applicant_email,'Applicant')||' has not received a documented call from '||
 coalesce(u.organization_name,u.contact_name,'the assigned Program Holder')||' after '||u.days_waiting||' days.',
 'warning',jsonb_build_object('program_holder_student_id',u.program_holder_student_id,'program_holder_id',u.program_holder_id,
 'application_id',u.application_id,'applicant_name',u.applicant_name,'applicant_email',u.applicant_email,
 'program_holder_name',u.contact_name,'organization_name',u.organization_name,'days_waiting',u.days_waiting)
 from public.program_holder_uncontacted_alerts u
 where not exists(select 1 from public.staff_notifications n
 where n.type='program_holder_applicant_uncontacted_5_days'
 and n.metadata->>'program_holder_student_id'=u.program_holder_student_id::text
 and n.created_at>=now()-interval '1 day');
 get diagnostics inserted_count=row_count; return inserted_count;
end; $$;

do $$ begin
 if exists(select 1 from cron.job where jobname='program-holder-five-day-contact-alerts') then
  perform cron.unschedule('program-holder-five-day-contact-alerts');
 end if;
 perform cron.schedule('program-holder-five-day-contact-alerts','0 13 * * *','select public.raise_program_holder_uncontacted_alerts();');
end $$;