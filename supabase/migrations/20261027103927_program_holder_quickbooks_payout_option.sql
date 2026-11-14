-- QuickBooks contractor setup is separate from its accounting OAuth connection.
-- This does not enable payouts or verify any holder.
alter table public.program_holder_payouts drop constraint if exists program_holder_payouts_payout_provider_check;
alter table public.program_holder_payouts add constraint program_holder_payouts_payout_provider_check check (payout_provider is null or payout_provider in ('paypal','branch','quickbooks'));
