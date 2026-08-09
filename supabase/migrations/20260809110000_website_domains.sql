-- Website custom domains (Domainee integration).
CREATE TABLE IF NOT EXISTS public.website_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid NOT NULL REFERENCES public.user_websites(id) ON DELETE CASCADE,
  user_id uuid,
  organization_id uuid,
  hostname text NOT NULL,
  domainee_domain_id text,
  domainee_purchase_id text,
  mode text NOT NULL DEFAULT 'connect',
  status text NOT NULL DEFAULT 'pending',
  origin_url text,
  dns_records jsonb DEFAULT '[]'::jsonb,
  verification_token text,
  monitor_status text,
  points_to_edge boolean DEFAULT false,
  customer_reference text,
  auto_renew boolean DEFAULT false,
  error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_domains_website_id_idx ON public.website_domains (website_id);
CREATE INDEX IF NOT EXISTS website_domains_user_id_idx ON public.website_domains (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS website_domains_domainee_domain_id_unique
  ON public.website_domains (domainee_domain_id) WHERE domainee_domain_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS website_domains_hostname_website_unique
  ON public.website_domains (lower(hostname), website_id) WHERE status <> 'deleted';

ALTER TABLE public.website_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS website_domains_owner_select ON public.website_domains;
CREATE POLICY website_domains_owner_select ON public.website_domains FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS website_domains_owner_insert ON public.website_domains;
CREATE POLICY website_domains_owner_insert ON public.website_domains FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS website_domains_owner_update ON public.website_domains;
CREATE POLICY website_domains_owner_update ON public.website_domains FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS website_domains_owner_delete ON public.website_domains;
CREATE POLICY website_domains_owner_delete ON public.website_domains FOR DELETE USING (auth.uid() = user_id);
