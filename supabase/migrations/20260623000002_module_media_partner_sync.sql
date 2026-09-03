-- Add module_type to modules for step-type routing
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS module_type text NOT NULL DEFAULT 'lesson'
    CHECK (module_type IN ('lesson', 'scorm', 'assessment', 'lab', 'checkpoint'));

-- Add published flag to media table
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

-- Link partner LMS sync logs to a provider
ALTER TABLE public.partner_lms_sync_logs
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.partner_lms_providers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_partner_lms_sync_logs_provider_id
  ON public.partner_lms_sync_logs (provider_id);
