-- Preserve prior approved Host Shops without pretending they passed the new document workflow.
update public.partners
set verification_status='verified',
    verification_details=coalesce(verification_details,'{}'::jsonb) || jsonb_build_object(
      'method','migrated_prior_approval',
      'note','Partner was already approved before the canonical automated verification workflow. Approval provenance is preserved; future renewals/updates use the current verification contract.',
      'migrated_at',now()
    ),
    public_slug=coalesce(public_slug,
      trim(both '-' from regexp_replace(lower(coalesce(dba,shop_name,name,'host-shop')),'[^a-z0-9]+','-','g')) || '-' || substr(replace(id::text,'-',''),1,8)
    ),
    public_profile_published_at=coalesce(public_profile_published_at,approved_at,now()),
    is_active=coalesce(is_active,true),
    status=case when status is null or status='' then 'active' else status end,
    updated_at=now()
where approval_status='approved' and verification_status='pending';

do $$
declare r record;
begin
  for r in
    with doc_counts as (
      select partner_id,count(distinct document_type) filter (where document_type in ('barbershop_license','salon_license','liability_insurance','workers_comp','supervisor_license','ein_letter')) required_docs
      from public.partner_documents group by partner_id
    )
    select p.id from public.partners p join doc_counts d on d.partner_id=p.id
    where p.approval_status<>'approved'
      and coalesce(p.license_number,'')<>''
      and coalesce(p.supervisor_name,'')<>''
      and coalesce(p.supervisor_license_number,'')<>''
      and coalesce(p.supervisor_years_licensed,0)>0
      and coalesce(p.has_general_liability,false)
      and coalesce(p.can_supervise_and_verify,false)
      and coalesce(p.workers_comp_status,'') in ('covered','exempt')
      and d.required_docs>=5
  loop
    perform public.evaluate_host_shop_verification(r.id);
  end loop;
end $$;

insert into public.rapids_action_queue(entity_type,entity_id,action_type,payload)
select 'host_shop',p.id,'register_employer_worksite',jsonb_build_object(
  'partner_id',p.id,'name',coalesce(p.dba,p.shop_name,p.name),'legal_name',p.legal_name,
  'programs',coalesce(p.programs,'[]'::jsonb),'state',p.state,'license_number',p.license_number,
  'source','approved_partner_backfill'
)
from public.partners p
where p.approval_status='approved'
  and lower(coalesce(p.partner_type,'')||' '||coalesce(p.program_type,'')||' '||coalesce(p.programs::text,'')) ~ '(barber|cosmet|esthetic|nail|salon|shop)'
on conflict(entity_type,entity_id,action_type) do nothing;

insert into public.rapids_action_queue(entity_type,entity_id,action_type,payload)
select 'apprentice',pe.id,'register_apprentice',jsonb_build_object(
  'enrollment_id',pe.id,'student_id',coalesce(pe.user_id,pe.student_id),'program_slug',pe.program_slug,
  'full_name',pe.full_name,'email',pe.email,'host_shop_id',pe.host_shop_id,'source','active_enrollment_backfill'
)
from public.program_enrollments pe
where pe.program_slug='barber-apprenticeship' and pe.status='active' and pe.rapids_id is null
on conflict(entity_type,entity_id,action_type) do nothing;
