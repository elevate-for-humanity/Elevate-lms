-- Host Site publication must require an authorized approval decision.
-- Document completeness/verification may prepare a record for review, but it must
-- never create apprenticeship approval, publish a Host Site, or queue RAPIDS work.

create or replace function public.evaluate_host_shop_verification(p_partner_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  p public.partners%rowtype;
  required_count integer;
  now_ts timestamptz:=now();
begin
  select * into p from public.partners where id=p_partner_id for update;
  if not found then return false; end if;

  select count(distinct document_type) into required_count
  from public.partner_documents
  where partner_id=p_partner_id
    and document_type in ('barbershop_license','salon_license','liability_insurance','workers_comp','supervisor_license','ein_letter');

  if coalesce(p.license_number,'')=''
     or coalesce(p.supervisor_name,'')=''
     or coalesce(p.supervisor_license_number,'')=''
     or coalesce(p.supervisor_years_licensed,0)<=0
     or coalesce(p.has_general_liability,false)=false
     or coalesce(p.can_supervise_and_verify,false)=false
     or coalesce(p.workers_comp_status,'') not in ('covered','exempt')
     or required_count<5 then
    update public.partners
       set verification_status='pending',
           verification_details=jsonb_build_object(
             'required_documents_present',required_count,
             'required_documents_expected',5,
             'method','deterministic_platform_validation',
             'approval_effect','none',
             'evaluated_at',now_ts
           ),
           updated_at=now_ts
     where id=p_partner_id;
    return false;
  end if;

  update public.partners
     set verification_status='ready_for_review',
         documents_verified=true,
         verification_details=jsonb_build_object(
           'required_documents_present',required_count,
           'required_documents_expected',5,
           'business_fields_present',true,
           'supervisor_fields_present',true,
           'insurance_declared',true,
           'workers_comp_status',p.workers_comp_status,
           'method','deterministic_platform_validation',
           'approval_effect','none',
           'note','Structured fields and required uploaded evidence are complete. Authorized Host Site approval is still required before public listing or RAPIDS action.',
           'evaluated_at',now_ts
         ),
         updated_at=now_ts
   where id=p_partner_id;

  return true;
end;
$$;

revoke all on function public.evaluate_host_shop_verification(uuid) from public,anon,authenticated;

-- Remove any publication/RAPIDS side effect that was tied merely to automatic
-- approval state changes. Authorized approval workflows may explicitly queue RAPIDS.
drop trigger if exists trg_enqueue_approved_host_shop_for_rapids on public.partners;

-- Public promotional view is not an approval authority. It exposes only partner
-- records already connected to an active Host Site partnership whose application
-- was approved by an authorized actor, never by system_verification.
create or replace view public.public_host_shops as
select
  p.id,
  p.public_slug,
  coalesce(p.dba, p.shop_name::varchar, p.name) as display_name,
  p.description,
  p.logo_url,
  p.flyer_url,
  p.website_url,
  p.website,
  p.phone,
  p.address_line1,
  p.address_line2,
  p.city,
  p.state,
  p.zip,
  p.programs,
  p.featured,
  p.display_order,
  p.public_profile_published_at,
  p.media_gallery,
  p.video_url,
  p.source_url,
  p.google_maps_url,
  p.media_verified_at
from public.partners p
join public.host_shop_partnerships hp
  on hp.partner_id=p.id
join public.host_shop_applications ha
  on ha.id=hp.application_id
where hp.status='active'
  and hp.directory_listing=true
  and ha.status='approved'
  and coalesce(ha.approved_by,'') <> 'system_verification'
  and p.status::text='active'
  and coalesce(p.is_active,true)=true
  and p.public_slug is not null;
