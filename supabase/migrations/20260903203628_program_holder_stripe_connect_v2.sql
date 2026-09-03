ALTER TABLE public.program_holder_payouts
  ADD COLUMN IF NOT EXISTS transfers_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_destination_type text,
  ADD COLUMN IF NOT EXISTS quickbooks_sync_status text NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS last_stripe_sync_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS program_holder_payouts_user_id_key
  ON public.program_holder_payouts(user_id);

ALTER TABLE public.program_holder_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_read_program_holder_payouts ON public.program_holder_payouts;
DROP POLICY IF EXISTS "Users can view own payouts" ON public.program_holder_payouts;
CREATE POLICY program_holder_payouts_select_own ON public.program_holder_payouts
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.program_holder_payouts FROM anon;
GRANT SELECT ON TABLE public.program_holder_payouts TO authenticated;
GRANT ALL ON TABLE public.program_holder_payouts TO service_role;

COMMENT ON COLUMN public.program_holder_payouts.stripe_account_id IS
  'Stripe Accounts v2 recipient ID. Full payout credentials remain at Stripe.';

