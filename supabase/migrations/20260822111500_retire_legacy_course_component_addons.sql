-- The public Store now sells one Course Creation & Learning Platform SKU.
-- Retire legacy component SKUs from active catalog discovery when no customer
-- currently owns them. Historical rows remain for compatibility/audit lookup.

update public.saas_addon_catalog
set active = false
where code in ('lms','course-builder','ai-course-factory')
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
