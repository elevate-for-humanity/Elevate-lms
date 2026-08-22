-- Retire legacy catalog entries that are not owned by the canonical Store
-- pricing/entitlement registry and have no active organization add-on records.
-- Historical rows remain in place for auditability; only new commerce discovery
-- and fulfillment eligibility is disabled.

update public.saas_addon_catalog
set active = false,
    updated_at = now()
where code in (
  'ADD-PRIORITY-SUPPORT',
  'ADD-DEDICATED-CSM',
  'ADD-WHITE-LABEL',
  'ADD-API-ACCESS',
  'ADD-SSO',
  'ADD-ANALYTICS-PRO',
  'ADD-LMS-INTEGRATION',
  'ADD-SALESFORCE'
)
and not exists (
  select 1
  from public.addon_subscriptions s
  where s.addon_code = saas_addon_catalog.code
    and s.active = true
)
and not exists (
  select 1
  from public.organization_addons oa
  where oa.addon_slug = saas_addon_catalog.code
    and oa.status = 'active'
);
