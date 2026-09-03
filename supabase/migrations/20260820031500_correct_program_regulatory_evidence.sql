-- Correct public regulatory evidence to exact, currently supportable program-level claims.

update public.program_regulatory_status prs
set status_value = 'not_verified',
    public_claim_allowed = false,
    source_reference = 'Current DWD public search returns Elevate Business Management; exact mapping to canonical Business Administration record not yet evidenced',
    source_url = 'https://indemandjobs.dwd.in.gov/Occupation/Training/11-9199/?target=_blank',
    verified_at = now(),
    updated_at = now()
from public.programs p
where prs.program_id = p.id
  and p.slug = 'business-administration'
  and prs.status_type in ('etpl','wioa');

update public.programs
set funding_eligible = false,
    funding_confirmed = false,
    wioa_approved = false,
    etpl_listed = false,
    updated_at = now()
where slug = 'business-administration';

update public.program_regulatory_status prs
set status_value = 'verified',
    public_claim_allowed = true,
    source_reference = 'Indiana DWD INTraining: Commercial Driver''s License (CDL), Workforce Ready Grant Approved, Program Location ID 10005156, 2026-07-01',
    verified_at = now(),
    updated_at = now()
from public.programs p
where prs.program_id = p.id
  and p.slug = 'cdl-training'
  and prs.status_type = 'wrg';

update public.program_regulatory_status prs
set source_reference = case
      when prs.status_type = 'wrg' then 'Indiana NextLevel Jobs Available Job Training lists Elevate for Humanity under HVAC Technician'
      else 'Indiana DWD InDemandJobs training directory lists Elevate for Humanity Training Center - HVAC technician'
    end,
    source_url = case
      when prs.status_type = 'wrg' then 'https://www.in.gov/dwd/nextleveljobs/workforce-ready-grant/available-job-training/'
      else 'https://indemandjobs.dwd.in.gov/Occupation/Training/17-3029/?target=_blank'
    end,
    verified_at = now(),
    updated_at = now()
from public.programs p
where prs.program_id = p.id
  and p.slug = 'hvac-technician'
  and prs.status_type in ('etpl','wioa','wrg');

update public.program_claim_evidence pce
set is_current = false,
    updated_at = now()
from public.programs p
where pce.program_id = p.id
  and p.slug = 'business-administration'
  and pce.claim_key in ('etpl','wioa','wrg','funding');
