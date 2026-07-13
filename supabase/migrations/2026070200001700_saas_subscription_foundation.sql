-- Phase 1: True SaaS licensing layer (organization = tenant)
-- Idempotent — run in Supabase SQL Editor.

-- ─── Catalog ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  monthly_price numeric(10, 2) NOT NULL,
  annual_price numeric(10, 2),
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_features (
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, feature_id)
);

CREATE TABLE IF NOT EXISTS public.saas_addon_catalog (
  code text PRIMARY KEY,
  name text NOT NULL,
  monthly_price numeric(10, 2) NOT NULL,
  feature_codes text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Per-organization subscriptions (organization_id = tenants.id) ─────────

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  billing_interval text NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  current_period_end timestamptz,
  canceled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

CREATE TABLE IF NOT EXISTS public.addon_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  addon_code text NOT NULL REFERENCES public.saas_addon_catalog(code),
  monthly_price numeric(10, 2),
  stripe_subscription_item_id text,
  active boolean NOT NULL DEFAULT true,
  activated_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, addon_code)
);

CREATE INDEX IF NOT EXISTS organization_subscriptions_org_idx
  ON public.organization_subscriptions (organization_id);
CREATE INDEX IF NOT EXISTS addon_subscriptions_org_idx
  ON public.addon_subscriptions (organization_id);

-- ─── Seed features ─────────────────────────────────────────────────────────

INSERT INTO public.features (code, name) VALUES
  ('crm', 'CRM'),
  ('website', 'Website'),
  ('bookings', 'Bookings'),
  ('forms', 'Forms'),
  ('email_marketing', 'Email marketing'),
  ('ai_basic', 'AI basic'),
  ('ai', 'AI assistant'),
  ('sms', 'SMS'),
  ('automation', 'Automation'),
  ('invoicing', 'Invoicing'),
  ('lead_funnels', 'Lead funnels'),
  ('client_portal', 'Client portal'),
  ('lms', 'LMS'),
  ('certificates', 'Certificates'),
  ('workflow_automation', 'Workflow automation'),
  ('reporting', 'Reporting'),
  ('custom_branding', 'Custom branding'),
  ('student_management', 'Student management'),
  ('workforce', 'Workforce development'),
  ('apprenticeship', 'Apprenticeship management'),
  ('employer_portal', 'Employer portal'),
  ('testing_center', 'Testing center'),
  ('white_label_mobile', 'White label mobile'),
  ('api_access', 'API access')
ON CONFLICT (code) DO NOTHING;

-- ─── Seed plans ────────────────────────────────────────────────────────────

INSERT INTO public.subscription_plans (slug, name, monthly_price, annual_price, limits, sort_order) VALUES
  (
    'solo',
    'Solo',
    29,
    290,
    '{"users": 1, "contacts": 100, "locations": 1}'::jsonb,
    1
  ),
  (
    'business',
    'Business',
    59,
    590,
    '{"users": 3, "contacts": 5000, "locations": 1, "automation": true}'::jsonb,
    2
  ),
  (
    'professional',
    'Professional',
    99,
    990,
    '{"users": 10, "contacts": null, "locations": 1, "automation": true, "custom_branding": true}'::jsonb,
    3
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  limits = EXCLUDED.limits,
  updated_at = now();

-- Plan ↔ feature links (Solo)
INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM public.subscription_plans p, public.features f
WHERE p.slug = 'solo' AND f.code IN (
  'crm', 'website', 'bookings', 'forms', 'email_marketing', 'ai_basic'
)
ON CONFLICT DO NOTHING;

-- Business = Solo + automation, invoicing, funnels, client_portal, sms
INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM public.subscription_plans p, public.features f
WHERE p.slug = 'business' AND f.code IN (
  'crm', 'website', 'bookings', 'forms', 'email_marketing', 'ai_basic',
  'automation', 'invoicing', 'lead_funnels', 'client_portal', 'sms'
)
ON CONFLICT DO NOTHING;

-- Professional = Business + lms, certificates, workflow, reporting, custom_branding
INSERT INTO public.plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM public.subscription_plans p, public.features f
WHERE p.slug = 'professional' AND f.code IN (
  'crm', 'website', 'bookings', 'forms', 'email_marketing', 'ai_basic',
  'automation', 'invoicing', 'lead_funnels', 'client_portal', 'sms',
  'lms', 'certificates', 'workflow_automation', 'reporting', 'custom_branding'
)
ON CONFLICT DO NOTHING;

-- ─── Seed add-on catalog (Stripe-aligned monthly prices) ───────────────────

INSERT INTO public.saas_addon_catalog (code, name, monthly_price, feature_codes, sort_order) VALUES
  ('lms', 'Online Courses / LMS', 29, ARRAY['lms', 'certificates'], 1),
  ('ai-assistant', 'AI Add-On', 19, ARRAY['ai', 'ai_basic'], 2),
  ('sms', 'Text Messaging', 15, ARRAY['sms'], 3),
  ('student-management', 'Student Management', 49, ARRAY['student_management'], 4),
  ('workforce-development', 'Workforce Development', 99, ARRAY['workforce'], 5),
  ('apprenticeship-management', 'Apprenticeship Management', 99, ARRAY['apprenticeship'], 6),
  ('employer-portal', 'Employer Portal', 49, ARRAY['employer_portal'], 7),
  ('testing-center', 'Credential Testing Center', 49, ARRAY['testing_center'], 8),
  ('white-label-mobile', 'White Label Mobile App', 199, ARRAY['white_label_mobile'], 9),
  ('additional-user', 'Additional User', 10, ARRAY[]::text[], 10),
  ('additional-location', 'Additional Location', 25, ARRAY[]::text[], 11),
  ('additional-storage', 'Additional Storage (100GB)', 10, ARRAY[]::text[], 12)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  feature_codes = EXCLUDED.feature_codes;

-- Map legacy checkout slugs → catalog codes (ai-addon → ai-assistant)
-- Handled in application code during fulfillment.

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_addon_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscription_plans_public_read ON public.subscription_plans;
CREATE POLICY subscription_plans_public_read ON public.subscription_plans
  FOR SELECT TO authenticated, anon USING (active = true);

DROP POLICY IF EXISTS features_public_read ON public.features;
CREATE POLICY features_public_read ON public.features
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS plan_features_public_read ON public.plan_features;
CREATE POLICY plan_features_public_read ON public.plan_features
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS saas_addon_catalog_public_read ON public.saas_addon_catalog;
CREATE POLICY saas_addon_catalog_public_read ON public.saas_addon_catalog
  FOR SELECT TO authenticated, anon USING (active = true);

DROP POLICY IF EXISTS organization_subscriptions_org_read ON public.organization_subscriptions;
CREATE POLICY organization_subscriptions_org_read ON public.organization_subscriptions
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.tenant_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS addon_subscriptions_org_read ON public.addon_subscriptions;
CREATE POLICY addon_subscriptions_org_read ON public.addon_subscriptions
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.tenant_id IS NOT NULL
    )
  );

-- Service role / admin writes use admin client (bypass RLS).
