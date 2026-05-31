-- Tenant website builder columns (apply manually in Supabase SQL Editor).
ALTER TABLE public.user_websites
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subdomain text,
  ADD COLUMN IF NOT EXISTS site_name text,
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS site_config jsonb DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS user_websites_subdomain_unique
  ON public.user_websites (subdomain)
  WHERE subdomain IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_websites_organization_id_idx
  ON public.user_websites (organization_id);

ALTER TABLE public.website_pages
  ADD COLUMN IF NOT EXISTS website_id uuid,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS is_home boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocks jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS website_pages_website_id_idx
  ON public.website_pages (website_id);
