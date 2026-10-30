-- Preserve organization preferences on the canonical partner record for every Host Shop.
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.partners.notification_preferences IS
  'Host Shop organization notification preferences; written through the authorized partner settings endpoint.';
