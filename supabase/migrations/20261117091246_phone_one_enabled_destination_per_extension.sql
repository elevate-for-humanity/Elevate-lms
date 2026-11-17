-- Preserve paused destinations and historical calls; prevent competing live routes.
CREATE UNIQUE INDEX IF NOT EXISTS phone_destinations_one_enabled_extension
  ON public.phone_destinations (phone_system_id, extension_id)
  WHERE destination_type = 'webrtc' AND enabled AND extension_id IS NOT NULL;
