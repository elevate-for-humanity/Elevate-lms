-- Store Calendly Personal Access Token in app_secrets.
-- Used by server-side API routes to interact with the Calendly API
-- (read scheduled events, verify bookings, create scheduling links).
--
-- DO NOT run this file as-is. Replace <CALENDLY_PAT> with the actual token
-- from Calendly -> Integrations -> API & Webhooks -> Personal Access Tokens.
-- Run manually in Supabase Dashboard -> SQL Editor.
--
-- Token is service-role only via RLS on app_secrets.
-- Rotate by running:
--   UPDATE app_secrets SET value = '<new_token>', updated_at = now()
--   WHERE key = 'CALENDLY_PAT';

INSERT INTO app_secrets (key, value, scope, note)
VALUES (
  'CALENDLY_PAT',
  '<CALENDLY_PAT>',
  'runtime',
  'Calendly Personal Access Token. Scopes: event_types:read/write, scheduled_events:read/write, scheduling_links:write, availability:read/write, webhooks:read/write. Rotate at https://calendly.com/integrations/api_webhooks'
)
ON CONFLICT (key) DO UPDATE
  SET value      = EXCLUDED.value,
      note       = EXCLUDED.note,
      updated_at = now();
