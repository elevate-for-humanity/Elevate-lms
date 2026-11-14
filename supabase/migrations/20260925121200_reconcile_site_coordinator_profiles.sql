-- Reconcile legacy coordinator profiles to the canonical site_coordinator role.
-- The program_holders row remains the shared scoped workspace entity; only the
-- account role changes so routing/navigation/onboarding are consistent.
update public.profiles p
set role = 'site_coordinator'
from public.program_holders ph
where ph.user_id = p.id
  and lower(coalesce(ph.features->>'approved_role','')) like '%site coordinator%'
  and p.role not in ('admin','super_admin','staff','org_admin')
  and p.role <> 'site_coordinator';
