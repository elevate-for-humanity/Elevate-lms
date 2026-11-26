-- SMS auto-reply (TextFree parity): when someone texts a business number,
-- the phone system can send one configured reply back, at most once per
-- sender per 24 hours. The setting lives on phone_systems next to the other
-- Admin phone preferences (greeting, routing_mode, ai_*), edited from the
-- Communications Hub settings. The application code treats a missing column
-- as "off", so the code is safe before or after this migration — but the
-- setting can only be saved and used once this has been applied.
-- NOT YET APPLIED ANYWHERE: per standing rule, migrations are tested in QA
-- before merge/application to production.
ALTER TABLE public.phone_systems
  ADD COLUMN IF NOT EXISTS sms_auto_reply_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_auto_reply_message text;
