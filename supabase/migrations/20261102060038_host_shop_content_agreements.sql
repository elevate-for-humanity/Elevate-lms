create table if not exists public.host_shop_content_agreements (
 id uuid primary key default gen_random_uuid(),
 partner_id uuid not null references public.partners(id),
 signed_by uuid not null references auth.users(id),
 version text not null,
 content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
 agreement_text text not null,
 signer_name text not null,
 signer_title text not null,
 signer_email text not null,
 signed_at timestamptz not null default now(),
 ip_address text,
 user_agent text,
 unique (partner_id, version)
);
create index if not exists host_shop_content_agreements_signer_idx on public.host_shop_content_agreements(signed_by);
alter table public.host_shop_content_agreements enable row level security;
revoke all on public.host_shop_content_agreements from anon, authenticated;
grant select on public.host_shop_content_agreements to authenticated;
grant all on public.host_shop_content_agreements to service_role;
create policy host_shop_content_agreements_scoped_read on public.host_shop_content_agreements
 for select to authenticated using (
 exists (select 1 from public.partner_users pu where pu.partner_id=host_shop_content_agreements.partner_id and pu.user_id=(select auth.uid()) and pu.status='active')
 or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','org_admin') and p.is_active is not false and p.suspended is not true)
);
comment on table public.host_shop_content_agreements is 'Versioned shop agreement receipts. Only validated server actions insert; clients cannot insert, update, or delete signatures.';
