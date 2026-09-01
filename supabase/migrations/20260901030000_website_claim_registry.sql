-- Canonical, tenant-owned evidence registry for Website Builder public claims.
-- Owners may submit and revise evidence. Only authorized staff may verify a
-- claim and make it eligible for publication.

create table if not exists public.website_claim_registry (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.user_websites(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  claim_key text not null check (claim_key ~ '^[a-z0-9][a-z0-9_:-]{1,119}$'),
  claim_text text not null check (length(btrim(claim_text)) between 1 and 2000),
  claim_value jsonb not null default 'null'::jsonb,
  claim_category text not null check (claim_category in (
    'business_fact','pricing','inventory','testimonial','rating','outcome',
    'operational_metric','credential','license','accreditation','contact','staff'
  )),
  status text not null default 'pending_review' check (status in (
    'draft','pending_review','verified','rejected','expired'
  )),
  evidence_type text,
  evidence_reference text,
  evidence_url text,
  methodology text,
  valid_from date,
  valid_through date,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  public_claim_allowed boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id, claim_key),
  constraint website_claim_verified_integrity check (
    (status = 'verified' and verified_at is not null and verified_by is not null and public_claim_allowed)
    or
    (status <> 'verified' and public_claim_allowed = false)
  ),
  constraint website_claim_validity_window check (
    valid_from is null or valid_through is null or valid_from <= valid_through
  ),
  constraint website_claim_review_requires_evidence check (
    status = 'draft'
    or nullif(btrim(evidence_reference), '') is not null
    or nullif(btrim(evidence_url), '') is not null
  )
);

create index if not exists website_claim_registry_owner_idx
  on public.website_claim_registry(owner_user_id, website_id, status);
create index if not exists website_claim_registry_publish_idx
  on public.website_claim_registry(website_id, status, valid_through)
  where public_claim_allowed = true;

alter table public.website_claim_registry enable row level security;

drop policy if exists website_claim_owner_select on public.website_claim_registry;
create policy website_claim_owner_select
  on public.website_claim_registry for select to authenticated
  using ((select auth.uid()) = owner_user_id or (select public.is_admin()));

drop policy if exists website_claim_owner_insert on public.website_claim_registry;
create policy website_claim_owner_insert
  on public.website_claim_registry for insert to authenticated
  with check (
    (select auth.uid()) = owner_user_id
    and status in ('draft','pending_review')
    and verified_at is null and verified_by is null and public_claim_allowed = false
    and exists (
      select 1 from public.user_websites w
      where w.id = website_id and w.user_id = (select auth.uid())
    )
  );

drop policy if exists website_claim_owner_update on public.website_claim_registry;
create policy website_claim_owner_update
  on public.website_claim_registry for update to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check (
    (select auth.uid()) = owner_user_id
    and status in ('draft','pending_review')
    and verified_at is null and verified_by is null and public_claim_allowed = false
    and exists (
      select 1 from public.user_websites w
      where w.id = website_id and w.user_id = (select auth.uid())
    )
  );

drop policy if exists website_claim_owner_delete on public.website_claim_registry;
create policy website_claim_owner_delete
  on public.website_claim_registry for delete to authenticated
  using ((select auth.uid()) = owner_user_id and status <> 'verified');

drop policy if exists website_claim_admin_all on public.website_claim_registry;
create policy website_claim_admin_all
  on public.website_claim_registry for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.website_claim_registry from public, anon;
grant select, insert, update, delete on table public.website_claim_registry to authenticated;
grant all on table public.website_claim_registry to service_role;

comment on table public.website_claim_registry is
  'Evidence-backed Website Builder claims. Client site_config never grants verification; publication hydrates only staff-verified rows.';
