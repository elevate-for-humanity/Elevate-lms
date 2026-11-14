
create table if not exists public.image_release_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  participant_name text not null,
  signed_name text not null,
  signer_capacity text not null check (signer_capacity in ('self','parent_guardian')),
  guardian_relationship text,
  consent_scope text not null default 'internal_and_public'
    check (consent_scope in ('internal_only','internal_and_public')),
  document_version text not null,
  release_text text not null,
  granted boolean not null default true,
  signed_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint image_release_guardian_relationship_check check (
    signer_capacity <> 'parent_guardian'
    or nullif(btrim(guardian_relationship), '') is not null
  )
);

create unique index if not exists image_release_consents_active_user_key
  on public.image_release_consents(user_id)
  where granted = true and revoked_at is null;

create index if not exists image_release_consents_user_signed_idx
  on public.image_release_consents(user_id, signed_at desc);

alter table public.image_release_consents enable row level security;

drop policy if exists image_release_select_own on public.image_release_consents;
create policy image_release_select_own
  on public.image_release_consents for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists image_release_insert_own on public.image_release_consents;
create policy image_release_insert_own
  on public.image_release_consents for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists image_release_update_own on public.image_release_consents;
create policy image_release_update_own
  on public.image_release_consents for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.image_release_consents to authenticated;

comment on table public.image_release_consents is
  'Versioned image-release consent. Profile photo storage is independent; public use requires an active internal_and_public consent.';
