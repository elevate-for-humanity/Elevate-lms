-- tax_payments: tracks Stripe payment state for SupersonicFastCash clients.
-- payment_status is written ONLY by the Stripe webhook handler, never by the
-- frontend redirect. The webhook is the source of truth.

CREATE TABLE IF NOT EXISTS public.tax_payments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id          text,
  stripe_checkout_session_id  text UNIQUE,
  stripe_payment_intent_id    text,
  amount                      integer NOT NULL,          -- cents
  currency                    text NOT NULL DEFAULT 'usd',
  payment_type                text NOT NULL DEFAULT 'deposit',  -- 'deposit' | 'full'
  status                      text NOT NULL DEFAULT 'pending',  -- 'pending' | 'paid' | 'failed' | 'refunded'
  paid_at                     timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tax_payments_client_id_idx   ON public.tax_payments(client_id);
CREATE INDEX IF NOT EXISTS tax_payments_session_id_idx  ON public.tax_payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS tax_payments_status_idx      ON public.tax_payments(status);

-- RLS: clients can read their own payment records
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_payments"
  ON public.tax_payments FOR SELECT
  USING (client_id = auth.uid());

-- All writes go through the API (service role) — no direct client inserts/updates
