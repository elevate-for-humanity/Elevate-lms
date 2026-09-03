-- Host Shop Subscription System
-- Plans, features, subscriptions, and host shop associations

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Plans table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  monthly_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  annual_price    NUMERIC(10,2),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  tier            TEXT NOT NULL DEFAULT 'starter',
                    CHECK (tier IN ('starter', 'professional', 'enterprise')),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Plan features
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plan_features (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key     TEXT NOT NULL,
  feature_value   JSONB DEFAULT '{"enabled": true}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, feature_key)
);

-- Standard feature keys:
-- host_apprentice_management, host_hours_approval, host_competency_signoff
-- host_evaluations, host_documents, host_reports_basic, host_reports_advanced
-- host_messaging, host_schedule, host_multi_location, host_ai_evaluations
-- host_compliance_exports, host_store_access
-- max_apprentices, max_instructors, max_storage_gb, max_ai_credits, max_sms_credits

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Host shop subscriptions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_shop_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES public.plans(id),
  status            TEXT NOT NULL DEFAULT 'active',
                    CHECK (status IN ('active', 'past_due', 'canceled', 'suspended', 'trialing')),
  billing_cycle     TEXT NOT NULL DEFAULT 'monthly',
                    CHECK (billing_cycle IN ('monthly', 'annual')),
  starts_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at           TIMESTAMPTZ,
  trial_ends_at     TIMESTAMPTZ,
  stripe_subscription_id  TEXT,
  stripe_customer_id    TEXT,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT false,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Host shops (extend tenants with shop-specific fields)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_shops (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id       UUID REFERENCES public.host_shop_subscriptions(id),
  business_name         TEXT NOT NULL,
  dba_name              TEXT,
  license_number        TEXT,
  license_expiry        DATE,
  owner_name            TEXT,
  owner_email           TEXT,
  owner_phone           TEXT,
  address_line1         TEXT,
  address_line2         TEXT,
  city                  TEXT,
  state                 TEXT DEFAULT 'IN',
  zip_code              TEXT,
  supervisor_name       TEXT,
  supervisor_license    TEXT,
  operating_hours       JSONB DEFAULT '{"mon":"9-5","tue":"9-5","wed":"9-5","thu":"9-5","fri":"9-5","sat":"closed","sun":"closed"}',
  logo_url              TEXT,
  programs_hosted       TEXT[] DEFAULT ARRAY['barber'],
  capacity              JSONB DEFAULT '{"barber":5,"cosmetology":5,"nail_tech":5,"esthetics":5}',
  onboarding_complete    BOOLEAN DEFAULT false,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Apprenticeships (link apprentices to host shops)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_shop_apprentices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_shop_id        UUID NOT NULL REFERENCES public.host_shops(id) ON DELETE CASCADE,
  apprentice_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supervisor_id       UUID REFERENCES auth.users(id),
  program_type        TEXT NOT NULL,
                    CHECK (program_type IN ('barber', 'cosmetology', 'nail_tech', 'esthetics')),
  status              TEXT NOT NULL DEFAULT 'active',
                    CHECK (status IN ('active', 'pending', 'completed', 'terminated')),
  start_date          DATE,
  expected_end_date    DATE,
  actual_end_date      DATE,
  current_level        TEXT DEFAULT 'year_1',
  progress_percent     NUMERIC(5,2) DEFAULT 0,
  assigned_by           UUID REFERENCES auth.users(id),
  notes               TEXT,
  metadata             JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (host_shop_id, apprentice_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Competency sign-offs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competency_signoffs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_shop_apprentice_id UUID NOT NULL REFERENCES public.host_shop_apprentices(id) ON DELETE CASCADE,
  skill_name          TEXT NOT NULL,
  skill_category      TEXT NOT NULL,
  evidence_type       TEXT CHECK (evidence_type IN ('photo', 'video', 'document')),
  evidence_url        TEXT,
  supervisor_notes    TEXT,
  supervisor_signed    BOOLEAN DEFAULT false,
  supervisor_signed_at TIMESTAMPTZ,
  supervisor_id       UUID REFERENCES auth.users(id),
  reviewed_by         UUID REFERENCES auth.users(id),
  reviewed_at         TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'pending',
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Apprentice hours (host shop approval)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.apprentice_hours (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_shop_apprentice_id UUID NOT NULL REFERENCES public.host_shop_apprentices(id) ON DELETE CASCADE,
  work_date           DATE NOT NULL,
  clock_in            TIMESTAMPTZ,
  clock_out           TIMESTAMPTZ,
  total_hours         NUMERIC(5,2) NOT NULL DEFAULT 0,
  break_minutes       INTEGER DEFAULT 0,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by        UUID REFERENCES auth.users(id),
  approved_at        TIMESTAMPTZ,
  rejected_reason     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Evaluations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_shop_evaluations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_shop_apprentice_id UUID NOT NULL REFERENCES public.host_shop_apprentices(id) ON DELETE CASCADE,
  evaluation_type     TEXT NOT NULL,
                    CHECK (evaluation_type IN ('monthly', 'quarterly', 'annual', 'performance')),
  period_start        DATE,
  period_end          DATE,
  performance_rating  INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
  attendance_rating   INTEGER CHECK (attendance_rating BETWEEN 1 AND 5),
  skill_progress_rating INTEGER CHECK (skill_progress_rating BETWEEN 1 AND 5),
  strengths           TEXT,
  areas_for_improvement TEXT,
  improvement_plan    TEXT,
  notes               TEXT,
  supervisor_signature BOOLEAN DEFAULT false,
  supervisor_signed_at TIMESTAMPTZ,
  supervisor_id       UUID REFERENCES auth.users(id),
  apprentice_acknowledged BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_host_shop_subscriptions_tenant ON public.host_shop_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_subscriptions_status ON public.host_shop_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_host_shops_tenant ON public.host_shops(tenant_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_apprentices_shop ON public.host_shop_apprentices(host_shop_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_apprentices_apprentice ON public.host_shop_apprentices(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_apprentices_status ON public.host_shop_apprentices(status);
CREATE INDEX IF NOT EXISTS idx_competency_signoffs_apprentice ON public.competency_signoffs(host_shop_apprentice_id);
CREATE INDEX IF NOT EXISTS idx_competency_signoffs_status ON public.competency_signoffs(status);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_apprentice ON public.apprentice_hours(host_shop_apprentice_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_status ON public.apprentice_hours(status);
CREATE INDEX IF NOT EXISTS idx_host_shop_evaluations_apprentice ON public.host_shop_evaluations(host_shop_apprentice_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_shop_apprentices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_shop_evaluations ENABLE ROW LEVEL SECURITY;

-- Plans: public read
DO $$ BEGIN CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Plan features: public read
DO $$ BEGIN CREATE POLICY "plan_features_public_read" ON public.plan_features FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Host shop subscriptions: tenant access
DO $$ BEGIN CREATE POLICY "subscriptions_tenant_access" ON public.host_shop_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = tenant_id AND owner_id = auth.uid()
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Host shops: tenant access
DO $$ BEGIN CREATE POLICY "host_shops_tenant_access" ON public.host_shops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = tenant_id AND owner_id = auth.uid()
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Host shop apprentices: shop staff access
DO $$ BEGIN CREATE POLICY "apprentices_shop_access" ON public.host_shop_apprentices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.host_shops hs
      JOIN public.tenants t ON t.id = hs.tenant_id
      WHERE hs.id = host_shop_id AND (t.owner_id = auth.uid() OR hs.supervisor_id = auth.uid())
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Competency signoffs: shop staff + apprentice self
DO $$ BEGIN CREATE POLICY "signoffs_shop_access" ON public.competency_signoffs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.host_shop_apprentices hsa
      JOIN public.host_shops hs ON hs.id = hsa.host_shop_id
      JOIN public.tenants t ON t.id = hs.tenant_id
      WHERE hsa.id = host_shop_apprentice_id 
        AND (t.owner_id = auth.uid() OR hsa.supervisor_id = auth.uid() OR hsa.apprentice_id = auth.uid())
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apprentice hours: shop staff + apprentice self
DO $$ BEGIN CREATE POLICY "hours_shop_access" ON public.apprentice_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.host_shop_apprentices hsa
      JOIN public.host_shops hs ON hs.id = hsa.host_shop_id
      JOIN public.tenants t ON t.id = hs.tenant_id
      WHERE hsa.id = host_shop_apprentice_id 
        AND (t.owner_id = auth.uid() OR hsa.supervisor_id = auth.uid() OR hsa.apprentice_id = auth.uid())
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Evaluations: shop staff + apprentice self
DO $$ BEGIN CREATE POLICY "evaluations_shop_access" ON public.host_shop_evaluations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.host_shop_apprentices hsa
      JOIN public.host_shops hs ON hs.id = hsa.host_shop_id
      JOIN public.tenants t ON t.id = hs.tenant_id
      WHERE hsa.id = host_shop_apprentice_id 
        AND (t.owner_id = auth.uid() OR hsa.supervisor_id = auth.uid() OR hsa.apprentice_id = auth.uid())
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Default Plans
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.plans (name, slug, description, monthly_price, annual_price, tier, metadata) VALUES
  ('Starter Host Shop', 'starter-host-shop', 
   'Perfect for new host shops. Includes up to 2 apprentices with basic hour tracking and messaging.',
   99.00, 990.00, 'starter',
   '{"max_apprentices": 2, "max_instructors": 1, "max_storage_gb": 5, "max_ai_credits": 100, "max_sms_credits": 50}'),

  ('Professional Host Shop', 'professional-host-shop',
   'For growing shops. Up to 10 apprentices with AI evaluations, competency tracking, and compliance exports.',
   249.00, 2490.00, 'professional',
   '{"max_apprentices": 10, "max_instructors": 3, "max_storage_gb": 25, "max_ai_credits": 1000, "max_sms_credits": 200}'),

  ('Enterprise Partner', 'enterprise-partner',
   'Unlimited apprentices, multi-location management, white labeling, and dedicated support.',
   499.00, 4990.00, 'enterprise',
   '{"max_apprentices": -1, "max_instructors": -1, "max_storage_gb": 100, "max_ai_credits": -1, "max_sms_credits": -1}')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      monthly_price = EXCLUDED.monthly_price,
      annual_price = EXCLUDED.annual_price,
      metadata = EXCLUDED.metadata;

-- Seed features for Starter
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_apprentice_management', '{"enabled": true}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_hours_approval', '{"enabled": true}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_messaging', '{"enabled": true}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_basic', '{"enabled": true}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_ai_evaluations', '{"enabled": false}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_advanced', '{"enabled": false}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_multi_location', '{"enabled": false}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_compliance_exports', '{"enabled": false}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;

-- Seed features for Professional
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_apprentice_management', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_hours_approval', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_competency_signoff', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_evaluations', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_documents', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_basic', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_advanced', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_messaging', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_schedule', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_ai_evaluations', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_compliance_exports', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_multi_location', '{"enabled": false}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;

-- Seed features for Enterprise (all enabled)
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_apprentice_management', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_hours_approval', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_competency_signoff', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_evaluations', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_documents', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_basic', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_advanced', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_messaging', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_schedule', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_ai_evaluations', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_compliance_exports', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_multi_location', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_store_access', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: get host shop features
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_host_shop_features(p_host_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id UUID;
  v_plan_id UUID;
  v_features JSONB;
BEGIN
  SELECT subscription_id, plan_id INTO v_subscription_id, v_plan_id
  FROM public.host_shops
  WHERE id = p_host_shop_id;

  IF v_plan_id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_object_agg(feature_key, feature_value)
  INTO v_features
  FROM public.plan_features
  WHERE plan_id = v_plan_id;

  RETURN COALESCE(v_features, '{}'::jsonb);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: check feature access
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_host_shop_feature(
  p_host_shop_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT (feature_value->>'enabled')::boolean INTO v_enabled
  FROM public.plan_features pf
  JOIN public.host_shops hs ON hs.plan_id = pf.plan_id
  WHERE hs.id = p_host_shop_id AND pf.feature_key = p_feature_key;

  RETURN COALESCE(v_enabled, false);
END;
$$;
