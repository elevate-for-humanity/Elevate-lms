-- Align the live legal acceptance ledger with the canonical recorder in
-- lib/legal/recordAgreementAcceptance.ts. Production previously lacked several
-- audit/context columns and enum values used by signed website agreements.
--
-- Historical acceptance rows are intentionally NOT backfilled because the
-- ledger has an immutability trigger. These additive fields apply to future
-- signatures without rewriting prior legal evidence.

alter type public.agreement_type add value if not exists 'ferpa';
alter type public.agreement_type add value if not exists 'participation';
alter type public.agreement_type add value if not exists 'media_release';
alter type public.agreement_type add value if not exists 'eula';
alter type public.agreement_type add value if not exists 'tos';
alter type public.agreement_type add value if not exists 'aup';
alter type public.agreement_type add value if not exists 'disclosures';
alter type public.agreement_type add value if not exists 'nda';
alter type public.agreement_type add value if not exists 'mou';

alter table public.license_agreement_acceptances
  add column if not exists auth_email text,
  add column if not exists signature_typed text,
  add column if not exists acceptance_context text,
  add column if not exists tenant_id uuid,
  add column if not exists program_id uuid,
  add column if not exists is_immutable boolean not null default true;
