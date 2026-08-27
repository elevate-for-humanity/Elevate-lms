-- Align live runtime contracts without recreating canonical tables.

ALTER TABLE public.webhook_events_processed
  DROP CONSTRAINT IF EXISTS webhook_events_processed_provider_check;
ALTER TABLE public.webhook_events_processed
  ADD CONSTRAINT webhook_events_processed_provider_check
  CHECK (provider IN (
    'stripe',
    'sezzle',
    'affirm',
    'jotform',
    'calendly',
    'resend',
    'sendgrid-inbound'
  ));

CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON public.product_images(product_id);

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.product_images'::regclass
      AND contype = 'f'
      AND confrelid = 'public.products'::regclass
      AND conkey = ARRAY[
        (SELECT attnum::smallint
         FROM pg_attribute
         WHERE attrelid = 'public.product_images'::regclass
           AND attname = 'product_id')
      ]
  ) THEN
    ALTER TABLE public.product_images
      ADD CONSTRAINT product_images_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES public.products(id)
      ON DELETE CASCADE;
  END IF;
END
$migration$;

-- The existing public_read RLS policy permits public catalog reads. The table
-- grant is the separate Data API permission required for that policy to run.
GRANT SELECT ON TABLE public.volunteer_opportunities TO anon;
