-- Individual per-user app subscriptions (Website Builder, SAM.gov, Grants)
-- Idempotent — safe to re-run in Supabase SQL Editor.

ALTER TABLE public.user_app_subscriptions
  ADD COLUMN IF NOT EXISTS app_slug text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Early baseline used column name "gov" instead of app_slug
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_app_subscriptions' AND column_name = 'gov'
  ) THEN
    UPDATE public.user_app_subscriptions
    SET app_slug = COALESCE(app_slug, gov)
    WHERE app_slug IS NULL AND gov IS NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_app_subscriptions_user_app_unique
  ON public.user_app_subscriptions (user_id, app_slug)
  WHERE user_id IS NOT NULL AND app_slug IS NOT NULL;

-- Website builder tables (columns may be missing if 20260530000001 not applied yet)
ALTER TABLE public.user_websites
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS subdomain text,
  ADD COLUMN IF NOT EXISTS site_name text,
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS site_config jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.website_pages
  ADD COLUMN IF NOT EXISTS website_id uuid,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS is_home boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocks jsonb DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS user_websites_subdomain_unique
  ON public.user_websites (subdomain)
  WHERE subdomain IS NOT NULL;

CREATE INDEX IF NOT EXISTS website_pages_website_id_idx
  ON public.website_pages (website_id);

ALTER TABLE public.user_app_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_app_subscriptions_select_own ON public.user_app_subscriptions;
CREATE POLICY user_app_subscriptions_select_own ON public.user_app_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_app_subscriptions_insert_own ON public.user_app_subscriptions;
CREATE POLICY user_app_subscriptions_insert_own ON public.user_app_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_app_subscriptions_update_own ON public.user_app_subscriptions;
CREATE POLICY user_app_subscriptions_update_own ON public.user_app_subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_websites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_websites_select_own ON public.user_websites;
CREATE POLICY user_websites_select_own ON public.user_websites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_websites_insert_own ON public.user_websites;
CREATE POLICY user_websites_insert_own ON public.user_websites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_websites_update_own ON public.user_websites;
CREATE POLICY user_websites_update_own ON public.user_websites
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_websites_delete_own ON public.user_websites;
CREATE POLICY user_websites_delete_own ON public.user_websites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS website_pages_via_own_website ON public.website_pages;
CREATE POLICY website_pages_via_own_website ON public.website_pages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_websites w
      WHERE w.id = website_pages.website_id AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_websites w
      WHERE w.id = website_pages.website_id AND w.user_id = auth.uid()
    )
  );
