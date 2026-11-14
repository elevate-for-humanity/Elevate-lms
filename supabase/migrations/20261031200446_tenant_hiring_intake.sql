-- Hiring remains part of the existing tenant intake record and its owner RLS.
ALTER TABLE public.tenant_site_leads
  ADD COLUMN IF NOT EXISTS intake_type text NOT NULL DEFAULT 'contact',
  ADD COLUMN IF NOT EXISTS hiring_data jsonb,
  ADD COLUMN IF NOT EXISTS hiring_token_hash text,
  ADD COLUMN IF NOT EXISTS hiring_version integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS tenant_site_leads_hiring_idx
  ON public.tenant_site_leads (website_id, created_at DESC) WHERE intake_type = 'hiring';
COMMENT ON COLUMN public.tenant_site_leads.hiring_token_hash IS
  'Hash of the anonymous applicant continuation token; never returned in public responses.';
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tenant-hiring-qualifications','tenant-hiring-qualifications',false,5242880,
  ARRAY['application/pdf','image/png','image/jpeg'])
ON CONFLICT (id) DO NOTHING;
-- No anonymous storage policy: uploads use the application capability on the
-- server, and downloads require authenticated management of this exact site.
