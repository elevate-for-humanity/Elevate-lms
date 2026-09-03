-- Canonical reconciliation for superseded future-dated migrations:
-- 20260815000001_store_product_images_variants.sql
-- 20260816000001_paris_schema.sql
-- 20260816000002_paris_media_schema.sql
--
-- This migration is intentionally additive and idempotent. It preserves the
-- existing canonical schema, fills missing PARIS/media/store objects, and fixes
-- RLS that previously allowed public writes or cross-user access.

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compare_price numeric,
  ADD COLUMN IF NOT EXISTS inventory_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS track_inventory boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.product_variants
SET name = COALESCE(NULLIF(name,''), NULLIF(sku,''), 'Default'),
    price = COALESCE(price, price_cents::numeric / 100.0, 0)
WHERE name IS NULL OR name = '' OR price IS NULL;

ALTER TABLE public.product_variants ALTER COLUMN name SET DEFAULT 'Default';
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin delete product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow admin insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow admin update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow read access to product variants" ON public.product_variants;
DROP POLICY IF EXISTS product_variants_public_read ON public.product_variants;
DROP POLICY IF EXISTS product_variants_admin_insert ON public.product_variants;
DROP POLICY IF EXISTS product_variants_admin_update ON public.product_variants;
DROP POLICY IF EXISTS product_variants_admin_delete ON public.product_variants;
DROP POLICY IF EXISTS product_variants_service_role ON public.product_variants;
CREATE POLICY product_variants_public_read ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY product_variants_admin_insert ON public.product_variants FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY product_variants_admin_update ON public.product_variants FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY product_variants_admin_delete ON public.product_variants FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY product_variants_service_role ON public.product_variants FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS avatar text,
  ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_type text DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tools text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS metrics jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_clone boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS clone_of uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ai_agents_owner ON public.ai_agents(owner_id);

DROP POLICY IF EXISTS ai_agents_owner_select ON public.ai_agents;
DROP POLICY IF EXISTS ai_agents_owner_insert ON public.ai_agents;
DROP POLICY IF EXISTS ai_agents_owner_update ON public.ai_agents;
DROP POLICY IF EXISTS ai_agents_owner_delete ON public.ai_agents;
CREATE POLICY ai_agents_owner_select ON public.ai_agents FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY ai_agents_owner_insert ON public.ai_agents FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY ai_agents_owner_update ON public.ai_agents FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY ai_agents_owner_delete ON public.ai_agents FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.agent_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  type text NOT NULL,
  action text NOT NULL,
  input jsonb,
  output jsonb,
  status text NOT NULL DEFAULT 'pending',
  duration integer,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requires_approval boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error text,
  timestamp timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_activities_agent ON public.agent_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_timestamp ON public.agent_activities(timestamp DESC);

CREATE TABLE IF NOT EXISTS public.agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  type text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  importance numeric(3,2) DEFAULT 0.5,
  access_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_agent_memories_agent ON public.agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_type ON public.agent_memories(type);

CREATE TABLE IF NOT EXISTS public.agent_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  source text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  embedding vector(1536),
  usage_count integer DEFAULT 0,
  relevance numeric(3,2) DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_agent ON public.agent_knowledge(agent_id);

CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  comments text,
  auto_approved boolean DEFAULT false,
  conditions jsonb
);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON public.approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_agent ON public.approval_workflows(agent_id);

CREATE TABLE IF NOT EXISTS public.brand_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  colors jsonb NOT NULL DEFAULT '{"primary":"#DC2626","secondary":"#1E3A5F","accent":"#F59E0B"}'::jsonb,
  fonts jsonb NOT NULL DEFAULT '{"heading":"Inter","body":"Inter"}'::jsonb,
  logo_url text,
  tagline text,
  voice jsonb NOT NULL DEFAULT '{"tone":"professional","values":[],"examples":[]}'::jsonb,
  hashtags text[] DEFAULT '{}'::text[],
  mentions text[] DEFAULT '{}'::text[],
  cta text DEFAULT 'Apply Now',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  platform text[] NOT NULL,
  text text NOT NULL,
  hashtags text[] DEFAULT '{}'::text[],
  media jsonb,
  meta jsonb,
  word_count integer,
  created_at timestamptz DEFAULT now(),
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON public.generated_content(type);
CREATE INDEX IF NOT EXISTS idx_generated_content_platform ON public.generated_content USING gin(platform);

CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES public.generated_content(id) ON DELETE SET NULL,
  platform text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  published_at timestamptz,
  published_url text,
  media_urls text[],
  created_at timestamptz DEFAULT now(),
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON public.scheduled_posts(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts(status);

CREATE TABLE IF NOT EXISTS public.published_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES public.generated_content(id) ON DELETE SET NULL,
  platform text NOT NULL,
  post_id text NOT NULL,
  published_url text,
  text text NOT NULL,
  hashtags text[],
  metrics jsonb,
  status text NOT NULL DEFAULT 'published',
  published_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_published_posts_platform ON public.published_posts(platform);
CREATE INDEX IF NOT EXISTS idx_published_posts_published_at ON public.published_posts(published_at DESC);

CREATE TABLE IF NOT EXISTS public.video_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  hook text NOT NULL,
  scenes jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta text,
  duration integer,
  voiceover text,
  music text,
  hashtags text[],
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  platform text NOT NULL,
  content_id uuid REFERENCES public.generated_content(id) ON DELETE SET NULL,
  content_type text NOT NULL,
  status text DEFAULT 'planned',
  notes text,
  created_at timestamptz DEFAULT now(),
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON public.content_calendar(date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_platform ON public.content_calendar(platform);

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS budget numeric(10,2),
  ADD COLUMN IF NOT EXISTS metrics jsonb,
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE public.campaigns SET org_id = COALESCE(org_id, created_by), metrics = COALESCE(metrics, stats) WHERE org_id IS NULL OR metrics IS NULL;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to campaigns" ON public.campaigns;

CREATE TABLE IF NOT EXISTS public.import_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text NOT NULL,
  source_url text,
  status text DEFAULT 'analyzing',
  analysis jsonb,
  compatibility jsonb,
  mapping jsonb,
  errors jsonb DEFAULT '[]'::jsonb,
  warnings jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_import_projects_status ON public.import_projects(status);
CREATE INDEX IF NOT EXISTS idx_import_projects_source ON public.import_projects(source);

CREATE TABLE IF NOT EXISTS public.imported_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.import_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  source_file text,
  target_location text,
  status text DEFAULT 'pending',
  conflict_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  title text,
  description text,
  alt_text text,
  source text NOT NULL,
  source_credit text,
  source_url text,
  width integer,
  height integer,
  aspect_ratio text,
  file_size bigint,
  format text,
  tags text[] DEFAULT '{}'::text[],
  seo_keywords text[] DEFAULT '{}'::text[],
  used_on text[] DEFAULT '{}'::text[],
  used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_generated boolean DEFAULT false,
  ai_prompt text,
  license text,
  requires_attribution boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_media_items_org ON public.media_items(org_id);
CREATE INDEX IF NOT EXISTS idx_media_items_source ON public.media_items(source);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON public.media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_tags ON public.media_items USING gin(tags);

CREATE TABLE IF NOT EXISTS public.media_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_image text,
  items text[] DEFAULT '{}'::text[],
  type text DEFAULT 'manual',
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_collections_org ON public.media_collections(org_id);
CREATE INDEX IF NOT EXISTS idx_media_collections_category ON public.media_collections(category);

CREATE TABLE IF NOT EXISTS public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  logo_primary text,
  logo_secondary text,
  logo_icon text,
  logo_dark text,
  logo_light text,
  color_primary text DEFAULT '#DC2626',
  color_secondary text DEFAULT '#1E3A5F',
  color_accent text DEFAULT '#F59E0B',
  color_text text DEFAULT '#1F2937',
  color_background text DEFAULT '#FFFFFF',
  font_heading text DEFAULT 'Inter',
  font_body text DEFAULT 'Inter',
  icons jsonb DEFAULT '[]'::jsonb,
  backgrounds jsonb DEFAULT '[]'::jsonb,
  textures jsonb DEFAULT '[]'::jsonb,
  templates jsonb DEFAULT '[]'::jsonb,
  watermarks jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agent_activities','agent_memories','agent_knowledge','approval_workflows','brand_guidelines','generated_content','scheduled_posts','published_posts','video_scripts','content_calendar','import_projects','imported_components','media_items','media_collections','brand_assets']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS agent_activities_access ON public.agent_activities;
CREATE POLICY agent_activities_access ON public.agent_activities FOR ALL TO authenticated
USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id=agent_activities.agent_id AND a.owner_id=auth.uid()))
WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id=agent_activities.agent_id AND a.owner_id=auth.uid()));

DROP POLICY IF EXISTS agent_memories_access ON public.agent_memories;
CREATE POLICY agent_memories_access ON public.agent_memories FOR ALL TO authenticated
USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id=agent_memories.agent_id AND a.owner_id=auth.uid()))
WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id=agent_memories.agent_id AND a.owner_id=auth.uid()));

DROP POLICY IF EXISTS agent_knowledge_access ON public.agent_knowledge;
CREATE POLICY agent_knowledge_access ON public.agent_knowledge FOR ALL TO authenticated
USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id=agent_knowledge.agent_id AND a.owner_id=auth.uid()))
WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id=agent_knowledge.agent_id AND a.owner_id=auth.uid()));

DROP POLICY IF EXISTS approval_workflows_access ON public.approval_workflows;
CREATE POLICY approval_workflows_access ON public.approval_workflows FOR ALL TO authenticated
USING (public.is_admin() OR requested_by=auth.uid() OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id=approval_workflows.agent_id AND a.owner_id=auth.uid()))
WITH CHECK (public.is_admin() OR requested_by=auth.uid() OR EXISTS (SELECT 1 FROM public.ai_agents a WHERE a.id=approval_workflows.agent_id AND a.owner_id=auth.uid()));

DROP POLICY IF EXISTS brand_guidelines_owner ON public.brand_guidelines;
CREATE POLICY brand_guidelines_owner ON public.brand_guidelines FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS generated_content_owner ON public.generated_content;
CREATE POLICY generated_content_owner ON public.generated_content FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS scheduled_posts_owner ON public.scheduled_posts;
CREATE POLICY scheduled_posts_owner ON public.scheduled_posts FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS published_posts_owner ON public.published_posts;
CREATE POLICY published_posts_owner ON public.published_posts FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS video_scripts_owner ON public.video_scripts;
CREATE POLICY video_scripts_owner ON public.video_scripts FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS content_calendar_owner ON public.content_calendar;
CREATE POLICY content_calendar_owner ON public.content_calendar FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS import_projects_owner ON public.import_projects;
CREATE POLICY import_projects_owner ON public.import_projects FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS imported_components_owner ON public.imported_components;
CREATE POLICY imported_components_owner ON public.imported_components FOR ALL TO authenticated
USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.import_projects p WHERE p.id=imported_components.project_id AND p.org_id=auth.uid()))
WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.import_projects p WHERE p.id=imported_components.project_id AND p.org_id=auth.uid()));
DROP POLICY IF EXISTS media_items_owner ON public.media_items;
CREATE POLICY media_items_owner ON public.media_items FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS media_collections_owner ON public.media_collections;
CREATE POLICY media_collections_owner ON public.media_collections FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());
DROP POLICY IF EXISTS brand_assets_owner ON public.brand_assets;
CREATE POLICY brand_assets_owner ON public.brand_assets FOR ALL TO authenticated USING (public.is_admin() OR org_id=auth.uid()) WITH CHECK (public.is_admin() OR org_id=auth.uid());

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agent_activities','agent_memories','agent_knowledge','approval_workflows','brand_guidelines','generated_content','scheduled_posts','published_posts','video_scripts','content_calendar','import_projects','imported_components','media_items','media_collections','brand_assets']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_service_role', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t || '_service_role', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
