-- store_products needs stripe_product_id so the Stripe webhook can look up
-- LMS access grants by Stripe product ID (the webhook receives prod_xxx, not a UUID).
-- Without this, the refund webhook's LMS access revocation silently no-ops.

ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

CREATE INDEX IF NOT EXISTS store_products_stripe_product_id_idx
  ON public.store_products(stripe_product_id)
  WHERE stripe_product_id IS NOT NULL;

-- Backfill from products table where product_id FK is set
UPDATE public.store_products sp
SET stripe_product_id = p.stripe_product_id
FROM public.products p
WHERE sp.product_id = p.id
  AND sp.stripe_product_id IS NULL
  AND p.stripe_product_id IS NOT NULL;
