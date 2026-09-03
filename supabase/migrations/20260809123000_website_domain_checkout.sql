-- Payment-first domain purchase state for Website Builder.
ALTER TABLE public.website_domains
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS provider_cost_cents integer,
  ADD COLUMN IF NOT EXISTS retail_cents integer;

CREATE UNIQUE INDEX IF NOT EXISTS website_domains_stripe_checkout_session_unique
  ON public.website_domains (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
