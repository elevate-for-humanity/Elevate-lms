-- Add stripe_subscription_status to program_enrollments so the learner
-- dashboard can show a "add payment method" banner when status is
-- pending_payment_method without making a live Stripe API call per page load.
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

COMMENT ON COLUMN public.program_enrollments.stripe_subscription_status IS
  'Mirrors Stripe subscription status (active, past_due, pending_payment_method, canceled, etc.). Updated by webhook.';

CREATE INDEX IF NOT EXISTS idx_program_enrollments_sub_status
  ON public.program_enrollments (stripe_subscription_status)
  WHERE stripe_subscription_status IS NOT NULL;
