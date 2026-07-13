-- store_products is missing product_id FK to products table.
-- cart-checkout queries store_products.product_id to resolve LMS access grants.
-- Without this column the lookup silently returns empty and no course access is granted.

ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS store_products_product_id_idx ON public.store_products(product_id);

-- Backfill: link existing store_products rows to products by matching name
UPDATE public.store_products sp
SET product_id = p.id
FROM public.products p
WHERE sp.product_id IS NULL
  AND lower(p.name) = lower(sp.name);
