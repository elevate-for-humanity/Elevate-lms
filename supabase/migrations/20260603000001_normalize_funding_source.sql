-- Normalise program_enrollments.funding_source values.
--
-- Fixes the drift introduced by 10 separate routes writing different
-- string representations of the same concept.
--
-- Canonical values after this migration:
--   self_pay   — student paying out of pocket (Stripe / BNPL)
--   funded     — employer, grant, or program-funded
--   wioa       — Workforce Innovation and Opportunity Act
--   jri        — Job Ready Indy
--   unknown    — no funding source recorded
--
-- Apply in Supabase Dashboard → SQL Editor.
-- Safe to run multiple times (idempotent UPDATE with WHERE).

begin;

-- self-pay variants → self_pay
update public.program_enrollments
set funding_source = 'self_pay'
where lower(trim(coalesce(funding_source, ''))) in (
  'self-pay', 'self_pay', 'self pay', 'selfpay', 'self-payment'
)
and funding_source <> 'self_pay';

-- funded variants → funded
update public.program_enrollments
set funding_source = 'funded'
where lower(trim(coalesce(funding_source, ''))) in (
  'funded', 'funded_program', 'funded program', 'employer funded',
  'employer-funded', 'grant', 'grant funded', 'grant-funded'
)
and funding_source <> 'funded';

-- null / empty → unknown
update public.program_enrollments
set funding_source = 'unknown'
where funding_source is null
   or trim(funding_source) = '';

commit;

-- Verify: run this after applying to confirm no unexpected values remain.
-- select funding_source, count(*) from public.program_enrollments
-- group by funding_source order by count desc;
