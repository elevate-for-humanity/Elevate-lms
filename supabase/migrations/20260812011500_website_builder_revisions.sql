-- Website Builder revision history.
-- Every manual save, PARIS sync/publish, and explicit restore can preserve a
-- recoverable snapshot without changing the live tenant renderer contract.
CREATE TABLE IF NOT EXISTS public.website_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES public.user_websites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  site_name text,
  subdomain text,
  site_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  reason text NOT NULL DEFAULT 'save',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_revisions_website_created_idx
  ON public.website_revisions (website_id, created_at DESC);
CREATE INDEX IF NOT EXISTS website_revisions_user_idx
  ON public.website_revisions (user_id, created_at DESC);

ALTER TABLE public.website_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS website_revisions_owner_select ON public.website_revisions;
CREATE POLICY website_revisions_owner_select
  ON public.website_revisions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS website_revisions_owner_insert ON public.website_revisions;
CREATE POLICY website_revisions_owner_insert
  ON public.website_revisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS website_revisions_owner_delete ON public.website_revisions;
CREATE POLICY website_revisions_owner_delete
  ON public.website_revisions FOR DELETE
  USING (auth.uid() = user_id);
