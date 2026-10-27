-- Provider-neutral contractor payouts. Legacy Stripe fields remain nullable
-- only for historical reconciliation; all new writes use provider_* fields.
ALTER TABLE public.program_holder_payouts
  ADD COLUMN IF NOT EXISTS payout_provider text,
  ADD COLUMN IF NOT EXISTS provider_recipient_id text,
  ADD COLUMN IF NOT EXISTS paypal_recipient_email text,
  ADD COLUMN IF NOT EXISTS instant_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_provider_sync_at timestamptz;

ALTER TABLE public.program_holder_payouts
  DROP CONSTRAINT IF EXISTS program_holder_payouts_payout_provider_check;
ALTER TABLE public.program_holder_payouts
  ADD CONSTRAINT program_holder_payouts_payout_provider_check
  CHECK (payout_provider IS NULL OR payout_provider IN ('paypal', 'branch'));

CREATE INDEX IF NOT EXISTS idx_program_holder_payouts_provider_recipient
  ON public.program_holder_payouts (payout_provider, provider_recipient_id)
  WHERE provider_recipient_id IS NOT NULL;

ALTER TABLE public.program_holder_payout_transactions
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_transfer_id text,
  ADD COLUMN IF NOT EXISTS provider_status text;

ALTER TABLE public.program_holder_payout_transactions
  DROP CONSTRAINT IF EXISTS program_holder_payout_transactions_provider_check;
ALTER TABLE public.program_holder_payout_transactions
  ADD CONSTRAINT program_holder_payout_transactions_provider_check
  CHECK (provider IS NULL OR provider IN ('paypal', 'branch'));

ALTER TABLE public.program_holder_payout_transactions
  DROP CONSTRAINT IF EXISTS program_holder_payout_transactions_quickbooks_status_check;
ALTER TABLE public.program_holder_payout_transactions
  ADD CONSTRAINT program_holder_payout_transactions_quickbooks_status_check
  CHECK (quickbooks_status IN ('pending', 'processing', 'synced', 'failed'));

CREATE UNIQUE INDEX IF NOT EXISTS program_holder_payout_transactions_provider_transfer_key
  ON public.program_holder_payout_transactions (provider, provider_transfer_id)
  WHERE provider_transfer_id IS NOT NULL;

COMMENT ON COLUMN public.program_holder_payouts.provider_recipient_id IS
  'Provider recipient reference; never a raw bank or card number.';
