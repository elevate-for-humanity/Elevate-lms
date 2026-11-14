-- Applied to Elevate production under this migration version.
-- Preserve existing individually negotiated agreement rows and audit history.
set local lock_timeout = '5s';
alter table public.program_holder_commission_agreements
  alter column commission_rate_bps drop default;
comment on table public.program_holder_commission_ledger is
  'Idempotent commission ledger using individually negotiated agreement terms, with refund reversals. No universal commission rate.';
