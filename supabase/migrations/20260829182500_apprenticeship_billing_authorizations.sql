CREATE TABLE IF NOT EXISTS public.billing_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.program_enrollments(id) ON DELETE CASCADE,
  program_slug text NOT NULL,
  authorization_type text NOT NULL CHECK (authorization_type = 'weekly_tuition_autopay'),
  status text NOT NULL CHECK (status IN ('checkout_started', 'authorized', 'revoked', 'failed')),
  stripe_customer_id text,
  stripe_checkout_session_id text NOT NULL UNIQUE,
  stripe_payment_method_id text,
  stripe_subscription_id text,
  authorized_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners read own billing authorizations"
  ON public.billing_authorizations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS billing_authorizations_user_idx
  ON public.billing_authorizations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS billing_authorizations_enrollment_idx
  ON public.billing_authorizations (enrollment_id);
