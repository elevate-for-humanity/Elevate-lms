-- Align the live legal acceptance ledger with the canonical recorder in
-- lib/legal/recordAgreementAcceptance.ts. Production previously lacked several
-- audit/context columns and enum values used by signed website agreements.

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

update public.license_agreement_acceptances
set auth_email = coalesce(auth_email, signer_email),
    acceptance_context = coalesce(acceptance_context, 'legacy'),
    is_immutable = true
where auth_email is null
   or acceptance_context is null
   or is_immutable is distinct from true;
