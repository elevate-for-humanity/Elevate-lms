-- payment_transactions
-- Canonical payment record for all program enrollments.
-- Referenced by /admin/analytics/revenue for YTD/monthly revenue reporting.

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id        uuid        REFERENCES public.programs(id) ON DELETE SET NULL,
  user_id           uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  amount            numeric(10,2) NOT NULL DEFAULT 0,
  currency          text        NOT NULL DEFAULT 'usd',
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','completed','failed','refunded','disputed')),
  payment_method    text,                          -- 'stripe','bnpl','wioa','cash','waived'
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id  text,
  enrollment_id     uuid,                          -- soft ref — enrollment tables vary by program type
  description       text,
  metadata          jsonb       DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_program_id  ON public.payment_transactions(program_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id     ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status      ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at  ON public.payment_transactions(created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_payment_transactions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER trg_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_transactions_updated_at();

-- RLS: admins read/write; users read their own
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_payment_transactions"  ON public.payment_transactions;
DROP POLICY IF EXISTS "user_own_payment_transactions"   ON public.payment_transactions;

CREATE POLICY "admin_all_payment_transactions" ON public.payment_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "user_own_payment_transactions" ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
