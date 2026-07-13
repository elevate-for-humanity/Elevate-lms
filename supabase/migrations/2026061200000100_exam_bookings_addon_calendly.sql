-- Add add-on purchase tracking and Calendly scheduling link to exam_bookings.
--
-- add_on:                  whether the Certification Success Package was purchased
-- add_on_paid:             payment confirmed for the add-on
-- calendly_scheduling_url: single-use Calendly link issued after payment
--
-- Apply in Supabase Dashboard → SQL Editor.

ALTER TABLE public.exam_bookings
  ADD COLUMN IF NOT EXISTS add_on                  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS add_on_paid             boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS calendly_scheduling_url text;
