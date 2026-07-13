-- Fix Natalia Roa's enrollment state
-- She was approved and an enrollment row was created, but her Stripe checkout
-- session expired without payment. Reset to payment_required so she is routed
-- to the payment flow on next login. 'pending' is not a valid enrollment_state
-- per the CHECK constraint — payment_required is the correct value.

UPDATE public.program_enrollments
SET
  enrollment_state      = 'payment_required',
  next_required_action  = 'PAYMENT',
  payment_status        = 'pending',
  stripe_checkout_session_id = NULL,  -- clear expired session
  updated_at            = now()
WHERE id = '6ad966f1-f8fd-457f-9f5e-5391072f9f29'
  AND user_id = '2d761d18-6ff9-4355-b9dd-5ff55903906b';

-- Also clear the expired session from the application row
UPDATE public.applications
SET
  stripe_session_id     = NULL,
  payment_status        = 'pending',
  updated_at            = now()
WHERE id = 'c4b48167-7780-4ea5-9c3c-53afa5c2cf1b'
  AND user_id = '2d761d18-6ff9-4355-b9dd-5ff55903906b';
