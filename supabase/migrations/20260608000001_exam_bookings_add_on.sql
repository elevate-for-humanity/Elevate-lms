-- Add add-on tracking columns to exam_bookings.
-- add_on: candidate selected the Certification Success Package at checkout
-- add_on_paid: payment confirmed (set by webhook after Stripe success)

ALTER TABLE public.exam_bookings
  ADD COLUMN IF NOT EXISTS add_on       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS add_on_paid  boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.exam_bookings.add_on      IS 'True when candidate selected the Certification Success Package ($59) at checkout';
COMMENT ON COLUMN public.exam_bookings.add_on_paid IS 'True after Stripe payment confirmed the add-on charge';
