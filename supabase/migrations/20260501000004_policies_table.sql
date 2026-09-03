-- policies table: CMS overlay for policy pages.
-- Pages under /policies/* query this table to surface DB-managed content
-- alongside static page content. Rows are optional — pages render fine
-- without them.

CREATE TABLE IF NOT EXISTS public.policies (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  category    text,
  content     text,
  summary     text,
  version     text,
  effective_date date,
  is_published boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policies_slug_idx ON public.policies (slug);
CREATE INDEX IF NOT EXISTS policies_category_idx ON public.policies (category);

COMMENT ON TABLE public.policies IS
  'CMS overlay for /policies/* pages. Rows are optional — pages render static content without them.';
