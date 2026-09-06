-- Connect learner identity verification to Stripe Identity without storing
-- biometric comparison data in Elevate. Stripe remains the processor of the
-- document/selfie match; Elevate stores only the decision and audit reference.
alter table public.id_verifications
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists stripe_verification_session_id text,
  add column if not exists provider text,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists id_verifications_stripe_session_uidx
  on public.id_verifications(stripe_verification_session_id)
  where stripe_verification_session_id is not null;

create index if not exists id_verifications_user_created_idx
  on public.id_verifications(user_id, created_at desc)
  where user_id is not null;

comment on column public.id_verifications.metadata is
  'Non-biometric provider outcome metadata. Never store ID images, selfie images, or biometric templates here.';
