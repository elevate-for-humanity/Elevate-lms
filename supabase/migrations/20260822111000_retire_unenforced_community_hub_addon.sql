-- Community Hub functionality remains in the platform, but its paid tenant
-- entitlement is not yet enforced at the learner community boundary. Keep the
-- historical catalog row while disabling new self-service fulfillment.

update public.saas_addon_catalog
set active = false
where code = 'community-hub'
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
