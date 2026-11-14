-- White Label Mobile remains a compatibility/managed capability until a
-- customer-specific provisioning and delivery lifecycle is implemented.
-- No active production add-on subscriptions used this code when retired.

update public.saas_addon_catalog
set active = false
where code = 'white-label-mobile'
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
