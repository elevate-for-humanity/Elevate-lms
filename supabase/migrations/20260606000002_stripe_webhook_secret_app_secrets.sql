-- Ensure STRIPE_WEBHOOK_SECRET exists in app_secrets so the webhook handler
-- can load it via hydrateProcessEnv() at runtime.
--
-- The canonical Stripe webhook handler (app/api/webhooks/stripe/route.ts) reads
-- process.env.STRIPE_WEBHOOK_SECRET after calling hydrateProcessEnv(). In
-- production, secrets live in this table — not in Netlify env vars — because
-- Netlify's Lambda 4KB env var limit prevents injecting all secrets.
--
-- ACTION REQUIRED after applying this migration:
--   1. Get your webhook signing secret from Stripe Dashboard →
--      Developers → Webhooks → select the endpoint → Signing secret
--   2. Run this UPDATE in Supabase SQL Editor:
--
--      UPDATE app_secrets
--      SET value = 'whsec_YOUR_ACTUAL_SECRET_HERE'
--      WHERE key = 'STRIPE_WEBHOOK_SECRET';
--
--   3. Verify the endpoint is registered for:
--      https://www.elevateforhumanity.org/api/webhooks/stripe
--
-- This migration inserts a placeholder row so the key exists in the table.
-- The placeholder value will cause signature verification to fail (400) until
-- you update it with the real secret — which is safer than silently dropping
-- events (the previous behavior when the key was missing).

INSERT INTO app_secrets (key, value, scope, description)
VALUES (
  'STRIPE_WEBHOOK_SECRET',
  'REPLACE_WITH_REAL_WHSEC_FROM_STRIPE_DASHBOARD',
  'runtime',
  'Stripe webhook signing secret for /api/webhooks/stripe. Get from Stripe Dashboard → Developers → Webhooks.'
)
ON CONFLICT (key) DO UPDATE
  SET
    scope = 'runtime',
    description = EXCLUDED.description,
    updated_at = now()
  -- Only update description/scope — do NOT overwrite an existing real secret value
  WHERE app_secrets.value = '' OR app_secrets.value IS NULL OR app_secrets.value = 'REPLACE_WITH_REAL_WHSEC_FROM_STRIPE_DASHBOARD';
