-- Canonical Host Shop self-service state machine.
-- Verification is deterministic platform verification of required structured fields
-- and required uploaded evidence. External issuing-authority verification remains
-- separately auditable where an authoritative integration is available.

alter table public.partners add column if not exists public_slug text;
alter table public.partners add column if not exists flyer_url text;
alter table public.partners add column if not exists public_profile_published_at timestamptz;
alter table public.partners add column if not exists verification_status text not null default 'pending';
alter table public.partners add column if not exists verification_details jsonb not null default '{}'::jsonb;

create unique index if not exists partners_public_slug_unique
  on public.partners(public_slug) where public_slug is not null;

create table if not exists public.rapids_action_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('host_shop','apprentice')),
  entity_id uuid not null,
  action_type text not null,
  status text not null default 'pending' check (status in ('pending','submitted','completed','blocked')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(entity_type,entity_id,action_type)
);

alter table public.rapids_action_queue enable row level security;

create or replace function public.enqueue_approved_host_shop_for_rapids()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.approval_status='approved' and coalesce(old.approval_status,'')<>'approved' then
    insert into public.rapids_action_queue(entity_type,entity_id,action_type,payload)
    values(
      'host_shop',new.id,'register_employer_worksite',
      jsonb_build_object(
        'partner_id',new.id,
        'name',coalesce(new.dba,new.shop_name,new.name),
        'legal_name',new.legal_name,
        'programs',coalesce(new.programs,'[]'::jsonb),
        'state',new.state,
        'license_number',new.license_number
      )
    )
    on conflict(entity_type,entity_id,action_type) do update
      set payload=excluded.payload,status='pending',updated_at=now();

    insert into public.staff_notifications(type,title,message,severity,metadata)
    values(
      'host_shop_auto_approved','Host Shop auto-approved',
      coalesce(new.dba,new.shop_name,new.name) || ' passed Host Shop verification and was auto-approved. RAPIDS employer/worksite setup is pending.',
      'info',jsonb_build_object('partner_id',new.id,'public_slug',new.public_slug,'rapids_action','register_employer_worksite')
    );
  end if;
  return new;
end;
$$;
revoke all on function public.enqueue_approved_host_shop_for_rapids() from public,anon,authenticated;

drop trigger if exists trg_enqueue_approved_host_shop_for_rapids on public.partners;
create trigger trg_enqueue_approved_host_shop_for_rapids
after update of approval_status on public.partners
for each row execute function public.enqueue_approved_host_shop_for_rapids();

create or replace function public.enqueue_active_apprentice_for_rapids()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.program_slug='barber-apprenticeship'
     and new.status='active'
     and (tg_op='INSERT' or coalesce(old.status,'')<>'active') then
    insert into public.rapids_action_queue(entity_type,entity_id,action_type,payload)
    values(
      'apprentice',new.id,'register_apprentice',
      jsonb_build_object(
        'enrollment_id',new.id,
        'student_id',coalesce(new.user_id,new.student_id),
        'program_slug',new.program_slug,
        'full_name',new.full_name,
        'email',new.email,
        'host_shop_id',new.host_shop_id
      )
    )
    on conflict(entity_type,entity_id,action_type) do update
      set payload=excluded.payload,status='pending',updated_at=now();

    insert into public.staff_notifications(type,title,message,severity,metadata)
    values(
      'apprentice_ready_for_rapids','Apprentice ready for RAPIDS',
      coalesce(new.full_name,new.email,'Barber apprentice') || ' is active and ready for RAPIDS registration.',
      'info',jsonb_build_object('enrollment_id',new.id,'student_id',coalesce(new.user_id,new.student_id),'rapids_action','register_apprentice')
    );
  end if;
  return new;
end;
$$;
revoke all on function public.enqueue_active_apprentice_for_rapids() from public,anon,authenticated;

drop trigger if exists trg_enqueue_active_apprentice_for_rapids on public.program_enrollments;
create trigger trg_enqueue_active_apprentice_for_rapids
after insert or update of status on public.program_enrollments
for each row execute function public.enqueue_active_apprentice_for_rapids();

create or replace function public.evaluate_host_shop_verification(p_partner_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  p public.partners%rowtype;
  required_count integer;
  slug_base text;
  slug_value text;
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
             'evaluated_at',now_ts
           ),
           updated_at=now_ts
     where id=p_partner_id;
    return false;
  end if;

  slug_base:=trim(both '-' from regexp_replace(lower(coalesce(p.dba,p.shop_name,p.name,'host-shop')),'[^a-z0-9]+','-','g'));
  if slug_base='' then slug_base:='host-shop'; end if;
  slug_value:=slug_base || '-' || substr(replace(p.id::text,'-',''),1,8);

  update public.partner_documents
     set status='accepted',reviewed_at=coalesce(reviewed_at,now_ts)
   where partner_id=p_partner_id
     and document_type in ('barbershop_license','salon_license','liability_insurance','workers_comp','supervisor_license','ein_letter')
     and status<>'accepted';

  update public.partners
     set approval_status='approved',
         approved_at=coalesce(approved_at,now_ts),
         account_status='active',
         status='active',
         is_active=true,
         documents_verified=true,
         verification_status='verified',
         verification_details=jsonb_build_object(
           'required_documents_present',required_count,
           'required_documents_expected',5,
           'business_fields_verified',true,
           'supervisor_fields_verified',true,
           'insurance_declared',true,
           'workers_comp_status',p.workers_comp_status,
           'method','deterministic_platform_validation',
           'note','Platform validation confirms required structured fields and required uploaded evidence are present. External issuing-authority validation remains separately auditable where available.',
           'evaluated_at',now_ts
         ),
         public_slug=coalesce(public_slug,slug_value),
         public_profile_published_at=coalesce(public_profile_published_at,now_ts),
         updated_at=now_ts
   where id=p_partner_id;

  update public.host_shop_partnerships
     set status='active',directory_listing=true,
         directory_listing_at=coalesce(directory_listing_at,now_ts),updated_at=now_ts
   where partner_id=p_partner_id;

  update public.host_shop_applications a
     set status='approved',approved_at=coalesce(approved_at,now_ts),
         approved_by=coalesce(approved_by,'system_verification'),updated_at=now_ts
   where exists(
     select 1 from public.host_shop_partnerships h
      where h.application_id=a.id and h.partner_id=p_partner_id
   );

  return true;
end;
$$;
revoke all on function public.evaluate_host_shop_verification(uuid) from public,anon,authenticated;

create or replace function public.evaluate_host_shop_after_document_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.evaluate_host_shop_verification(coalesce(new.partner_id,old.partner_id));
  return coalesce(new,old);
end;
$$;
revoke all on function public.evaluate_host_shop_after_document_change() from public,anon,authenticated;

drop trigger if exists trg_evaluate_host_shop_after_document_change on public.partner_documents;
create trigger trg_evaluate_host_shop_after_document_change
after insert or update of status,document_type,file_url on public.partner_documents
for each row execute function public.evaluate_host_shop_after_document_change();

create or replace view public.public_host_shops as
select id,public_slug,coalesce(dba,shop_name,name) as display_name,description,
       logo_url,flyer_url,website_url,website,phone,address_line1,address_line2,
       city,state,zip,programs,featured,display_order,public_profile_published_at
from public.partners
where approval_status='approved'
  and status='active'
  and coalesce(is_active,true)=true
  and verification_status='verified'
  and public_slug is not null;
