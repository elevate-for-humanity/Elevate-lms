-- QA ONLY. Run after the reviewed schema stages and real Auth provisioning.
-- No production records, credentials or historical approvals are copied.
WITH inserted_tenant AS (
  INSERT INTO public.tenants(name,slug,type)
  VALUES ('Disposable QA — release verification','elevate-lms-qa','elevate')
  ON CONFLICT(slug) DO NOTHING
  RETURNING id
), qa_tenant AS (
  SELECT id FROM inserted_tenant
  UNION ALL
  SELECT id FROM public.tenants WHERE slug='elevate-lms-qa'
)
INSERT INTO public.organizations(name,slug,tenant_id)
SELECT 'Disposable QA — release verification','elevate-lms-qa',id FROM qa_tenant
ON CONFLICT(slug) DO NOTHING;

INSERT INTO public.profiles
  (id,email,full_name,role,tenant_id,organization_id,enrollment_status,is_active)
SELECT u.id,u.email,u.raw_user_meta_data->>'full_name',
       u.raw_app_meta_data->>'role',o.tenant_id,o.id,'pending',true
FROM auth.users u CROSS JOIN public.organizations o
WHERE o.slug='elevate-lms-qa'
  AND u.raw_app_meta_data->>'qa_e2e'='true'
  AND u.raw_app_meta_data->>'role' IN
      ('admin','student','program_holder','host_shop','apprentice',
       'employer','instructor','staff','case_manager')
ON CONFLICT(id) DO NOTHING;
