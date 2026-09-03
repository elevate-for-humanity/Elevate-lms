-- Marketing tables: proper schemas replacing baseline stubs
-- Apply in Supabase Dashboard → SQL Editor

-- ── pricing_plans ─────────────────────────────────────────────────────────────
ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS tier          text,          -- free | student | career | partner
  ADD COLUMN IF NOT EXISTS price         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interval      text,          -- month | year | one_time | null
  ADD COLUMN IF NOT EXISTS price_display text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS features      jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS recommended   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label     text,
  ADD COLUMN IF NOT EXISTS cta_href      text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

-- ── impact_metrics ────────────────────────────────────────────────────────────
ALTER TABLE public.impact_metrics
  ADD COLUMN IF NOT EXISTS category      text,          -- learners | employers | community | funding
  ADD COLUMN IF NOT EXISTS label         text,
  ADD COLUMN IF NOT EXISTS value         text,
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS icon          text,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

-- ── content_blocks ────────────────────────────────────────────────────────────
ALTER TABLE public.content_blocks
  ADD COLUMN IF NOT EXISTS page          text,          -- what_we_do | homepage | about | etc
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS body          text,
  ADD COLUMN IF NOT EXISTS icon          text,
  ADD COLUMN IF NOT EXISTS image_url     text,
  ADD COLUMN IF NOT EXISTS cta_label     text,
  ADD COLUMN IF NOT EXISTS cta_href      text,
  ADD COLUMN IF NOT EXISTS order_index   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active     boolean DEFAULT true;

-- ── offerings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offerings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  category      text,          -- training | credentialing | apprenticeship | funding | support
  icon          text,
  image_url     text,
  cta_label     text,
  cta_href      text,
  features      jsonb DEFAULT '[]',
  order_index   integer DEFAULT 0,
  status        text DEFAULT 'active',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read offerings" ON public.offerings;
CREATE POLICY "Public read offerings" ON public.offerings FOR SELECT USING (status = 'active');

-- ── indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_blocks_page ON public.content_blocks(page);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_category ON public.impact_metrics(category);
CREATE INDEX IF NOT EXISTS idx_offerings_status ON public.offerings(status);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_tier ON public.pricing_plans(tier);
