-- Production acceptance hardening: remove accidental public access to PII,
-- license/billing records, tax-return payloads, and internal SECURITY DEFINER RPCs.
-- Public domain resolution and tax-return status lookup remain intentionally
-- exposed through narrow RPCs; their backing tables remain protected.

begin;

-- ---------------------------------------------------------------------------
-- Career applications: PII must never be readable merely because a row has no
-- user_id, nor should every signed-in user see every application.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view own applications" on public.career_applications;
drop policy if exists auth_read_career_applications on public.career_applications;
drop policy if exists career_applications_owner_or_staff_select on public.career_applications;

create policy career_applications_owner_or_staff_select
on public.career_applications
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'staff')
  )
);

-- Public intake is mediated by the JWT-protected process-intake Edge Function
-- using the service role. These legacy RPCs must not be callable directly from
-- the public REST RPC surface.
revoke all on function public.start_application(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.start_application(uuid, text, text, text, text) to service_role;

revoke all on function public.submit_application(uuid, boolean) from public, anon, authenticated;
grant execute on function public.submit_application(uuid, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- License rows include keys, customer/admin emails, Stripe identifiers and
-- subscription metadata. Remove the legacy unconditional public SELECT policy.
-- ---------------------------------------------------------------------------
drop policy if exists licenses_select on public.licenses;

-- ---------------------------------------------------------------------------
-- Tax returns contain direct identifiers and full intake/calculation/return
-- payloads. Anonymous tracking must go through sfc_get_status(), not SELECT *.
-- ---------------------------------------------------------------------------
drop policy if exists sfc_tax_returns_anon_tracking on public.sfc_tax_returns;
drop policy if exists sfc_returns_read_authenticated on public.sfc_tax_returns;
drop policy if exists sfc_tax_returns_service_all on public.sfc_tax_returns;

-- Service role bypasses RLS; authenticated access remains limited to the
-- existing explicit admin policies.

-- ---------------------------------------------------------------------------
-- Internal/trigger RPCs must not be directly executable by browsers.
-- ---------------------------------------------------------------------------
revoke all on function public.enforce_single_registered_apprenticeship_course() from public, anon, authenticated;
grant execute on function public.enforce_single_registered_apprenticeship_course() to service_role;

-- Notification tokens are consumed only through the server notification
-- service, which uses the service-role client. Keep token contents off PostgREST.
revoke all on function public.use_notification_token(text) from public, anon, authenticated;
grant execute on function public.use_notification_token(text) to service_role;

-- Published course versions already have an explicit public RLS policy. This
-- helper does not need owner privileges; let RLS enforce the public boundary.
alter function public.get_latest_published_version(uuid) security invoker;
grant execute on function public.get_latest_published_version(uuid) to anon, authenticated, service_role;

-- Certifying-body routing is governed by RLS and is not a privileged operation.
alter function public.recommend_certifying_body(text, text) security invoker;
revoke all on function public.recommend_certifying_body(text, text) from public, anon;
grant execute on function public.recommend_certifying_body(text, text) to authenticated, service_role;

-- Tax status and tenant-domain resolution are deliberately narrow public RPCs.
-- Their backing tables are no longer publicly selectable. Explicit grants make
-- the intended public surface reviewable instead of inheriting PUBLIC defaults.
revoke all on function public.sfc_get_status(text) from public;
grant execute on function public.sfc_get_status(text) to anon, authenticated, service_role;

revoke all on function public.get_tenant_by_domain(text) from public;
grant execute on function public.get_tenant_by_domain(text) to anon, authenticated, service_role;

commit;
