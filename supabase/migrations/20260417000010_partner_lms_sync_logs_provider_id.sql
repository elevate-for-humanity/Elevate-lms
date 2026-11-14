-- W016: partner_lms_sync_logs missing provider_id FK
-- Admin /admin/partners/lms-integrations/[id] filters sync logs by provider_id.
ALTER TABLE public.partner_lms_sync_logs
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.partner_lms_providers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_partner_lms_sync_logs_provider_id
  ON public.partner_lms_sync_logs (provider_id);

COMMENT ON COLUMN public.partner_lms_sync_logs.provider_id IS
  'FK to partner_lms_providers — scopes sync log rows to a specific integration';
