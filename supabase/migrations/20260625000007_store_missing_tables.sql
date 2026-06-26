-- Store: deployment_options and store_subscription_pricing tables
-- Referenced by app/store/deployment/page.tsx and app/store/subscriptions/page.tsx

-- Deployment options shown on /store/deployment
CREATE TABLE IF NOT EXISTS public.deployment_options (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,                        -- e.g. 'Vercel', 'AWS', 'Self-Hosted'
  slug          text NOT NULL UNIQUE,
  description   text,
  setup_time    text,                                 -- e.g. '5 minutes'
  cost_estimate text,                                 -- e.g. '$20-100/month'
  features      text[] NOT NULL DEFAULT '{}',
  is_recommended boolean NOT NULL DEFAULT false,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Seed the three deployment options the page already renders statically
INSERT INTO public.deployment_options (name, slug, description, setup_time, cost_estimate, features, is_recommended, display_order)
VALUES
  ('Vercel', 'vercel',
   'One-click deployment with automatic SSL and global CDN.',
   '5 minutes', '$20–100/month',
   ARRAY['One-click deployment','Automatic SSL certificates','Global CDN included','Auto-scaling'],
   true, 1),
  ('AWS / Azure / GCP', 'cloud',
   'Full infrastructure control with Docker container deployment.',
   '30 minutes', '$50–300/month',
   ARRAY['Full infrastructure control','Docker container deployment','VPC and security groups','Custom domain setup'],
   false, 2),
  ('Self-Hosted', 'self-hosted',
   'Complete data ownership with on-premise deployment.',
   '1–2 hours', 'Hardware costs + maintenance',
   ARRAY['Complete data ownership','On-premise deployment','Air-gapped environments','Custom security policies'],
   false, 3)
ON CONFLICT (slug) DO NOTHING;

-- Subscription pricing view used by /store/subscriptions
-- Joins store_products + store_prices into a flat shape the page expects
CREATE TABLE IF NOT EXISTS public.store_prices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  stripe_price_id  text UNIQUE,
  interval         text NOT NULL CHECK (interval IN ('month','year','one_time')),
  amount_cents     int NOT NULL CHECK (amount_cents >= 0),
  currency         text NOT NULL DEFAULT 'usd',
  trial_period_days int,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS: deployment_options is public read
ALTER TABLE public.deployment_options ENABLE ROW LEVEL SECURITY;
DROP policy if exists "deployment_options_public_read" on public.deployment_options;
CREATE policy "deployment_options_public_read" on public.deployment_options FOR SELECT USING (true);

-- RLS: store_prices readable by everyone (public pricing display)
ALTER TABLE public.store_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "store_prices_authenticated_read" ON public.store_prices;
CREATE POLICY "store_prices_public_read" ON public.store_prices FOR SELECT USING (true);

-- View: joins store_products + store_prices
CREATE OR REPLACE VIEW public.store_subscription_pricing AS
SELECT
  sp.id                                                        AS product_id,
  sp.name                                                      AS product_name,
  sp.description,
  '{}'::jsonb                                                   AS features,
  spr.id                                                       AS price_id,
  spr.stripe_price_id,
  spr.interval,
  spr.amount_cents,
  ROUND((spr.amount_cents / 100.0)::numeric, 2)                AS amount_dollars,
  CASE spr.interval
    WHEN 'month' THEN 'Monthly'
    WHEN 'year'  THEN 'Annual'
    ELSE initcap(spr.interval)
  END                                                          AS billing_period,
  CASE spr.interval
    WHEN 'year'  THEN ROUND((spr.amount_cents / 100.0 / 12)::numeric, 2)
    ELSE ROUND((spr.amount_cents / 100.0)::numeric, 2)
  END                                                          AS effective_monthly_price,
  spr.trial_period_days
FROM public.store_products sp
JOIN public.store_prices spr ON spr.product_id = sp.id
WHERE sp.status = 'active'
  AND spr.active = true
  AND sp.status = 'active'
ORDER BY spr.amount_cents ASC;

