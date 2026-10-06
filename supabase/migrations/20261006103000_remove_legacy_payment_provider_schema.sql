-- Forward-only cleanup for the retired payment provider.
-- Do not rewrite previously applied migrations; remove legacy schema objects here.

ALTER TABLE public.website_domains
  ADD COLUMN IF NOT EXISTS billing_provider text,
  ADD COLUMN IF NOT EXISTS provider_invoice_id text;

CREATE UNIQUE INDEX IF NOT EXISTS website_domains_provider_invoice_unique
  ON public.website_domains (billing_provider, provider_invoice_id)
  WHERE provider_invoice_id IS NOT NULL;

DROP INDEX IF EXISTS public.website_domains_stripe_checkout_session_unique;
ALTER TABLE public.website_domains DROP COLUMN IF EXISTS stripe_checkout_session_id;

ALTER TABLE public.community_member_access DROP COLUMN IF EXISTS stripe_subscription_id;

ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS billing_provider text,
  ADD COLUMN IF NOT EXISTS provider_payment_id text;
