-- Durable, idempotent ledger for scheduled Program Holder Stripe transfers.
CREATE TABLE IF NOT EXISTS public.program_holder_payout_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_schedule_id uuid NOT NULL REFERENCES public.payout_schedules(id) ON DELETE RESTRICT,
  enrollment_id uuid NOT NULL REFERENCES public.program_enrollments(id) ON DELETE RESTRICT,
  program_holder_id uuid NOT NULL REFERENCES public.program_holders(id) ON DELETE RESTRICT,
  installment smallint NOT NULL DEFAULT 1 CHECK (installment IN (1, 2)),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','paid','failed','reversed')),
  stripe_transfer_id text,
  quickbooks_status text NOT NULL DEFAULT 'pending' CHECK (quickbooks_status IN ('pending','synced','failed')),
  quickbooks_payment_id text,
  quickbooks_error text,
  failure_reason text,
  approved_by uuid REFERENCES auth.users(id),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payout_schedule_id, installment),
  UNIQUE (stripe_transfer_id)
);

CREATE INDEX IF NOT EXISTS idx_program_holder_payout_transactions_holder
  ON public.program_holder_payout_transactions(program_holder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_holder_payout_transactions_status
  ON public.program_holder_payout_transactions(status, created_at);

ALTER TABLE public.program_holder_payout_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY program_holder_payout_transactions_select_own
  ON public.program_holder_payout_transactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role IN ('admin','super_admin','staff')
    )
  );

REVOKE ALL ON TABLE public.program_holder_payout_transactions FROM anon;
GRANT SELECT ON TABLE public.program_holder_payout_transactions TO authenticated;
GRANT ALL ON TABLE public.program_holder_payout_transactions TO service_role;

COMMENT ON TABLE public.program_holder_payout_transactions IS
  'Authoritative ledger for Program Holder transfers. A row is paid only after Stripe confirms transfer creation.';
