-- Record the interoffice_sms_outbox table in migrations.
-- The table already exists in production (created out of band and in use by
-- the interoffice SMS processor, lib/notifications/interoffice-sms-outbox.ts),
-- but no migration described it, so the schema-drift audit reported
-- TABLE_NOT_IN_SCHEMA and required CI failed. Column definitions mirror the
-- live production table exactly; IF NOT EXISTS keeps this a no-op in prod.
CREATE TABLE IF NOT EXISTS interoffice_sms_outbox (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL,
  recipient_profile_id uuid NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider_message_id text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT interoffice_sms_outbox_pkey PRIMARY KEY (id)
);
