-- Canonical store checkout writes to store_orders + user_entitlements.
-- These indexes make Stripe/success retries safe and prevent duplicate access.

CREATE UNIQUE INDEX IF NOT EXISTS store_orders_stripe_session_id_uq
  ON public.store_orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_entitlements_user_product_uq
  ON public.user_entitlements (user_id, product_id)
  WHERE product_id IS NOT NULL;
