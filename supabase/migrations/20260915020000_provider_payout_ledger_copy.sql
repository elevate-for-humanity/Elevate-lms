-- Clarify the provider-neutral payout ledger after the retirement of Stripe Connect payouts.
-- Legacy stripe_* columns remain only for historical reconciliation and are not used by new writes.
COMMENT ON TABLE public.program_holder_payout_transactions IS
  'Authoritative ledger for Program Holder transfers. A row is paid only after the selected provider confirms delivery.';

COMMENT ON COLUMN public.program_holder_payouts.provider_recipient_id IS
  'Opaque recipient reference issued by the payout provider; never a raw bank or card number.';
