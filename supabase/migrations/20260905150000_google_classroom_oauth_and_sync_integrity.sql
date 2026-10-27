-- Make Google Classroom OAuth storage and course synchronization idempotent.
-- Tokens remain server-only through RLS and are never returned by application APIs.

alter table public.google_classroom_sync
  add column if not exists course_id text;

create unique index if not exists integration_tokens_user_provider_uidx
  on public.integration_tokens (user_id, provider);

create unique index if not exists integrations_slug_uidx
  on public.integrations (slug);

create unique index if not exists google_classroom_sync_user_course_uidx
  on public.google_classroom_sync (user_id, course_id)
  where course_id is not null;

drop policy if exists "integration_tokens_owner_read" on public.integration_tokens;
drop policy if exists "integration_tokens_owner_write" on public.integration_tokens;
drop policy if exists "integration_tokens_server_only" on public.integration_tokens;
create policy "integration_tokens_server_only" on public.integration_tokens
  for all to service_role using (true) with check (true);

drop policy if exists "classroom_sync_owner" on public.google_classroom_sync;
drop policy if exists "classroom_sync_owner_read" on public.google_classroom_sync;
drop policy if exists "Own sync" on public.google_classroom_sync;
drop policy if exists "admin_bypass_delete" on public.google_classroom_sync;
drop policy if exists "admin_bypass_insert" on public.google_classroom_sync;
drop policy if exists "admin_bypass_select" on public.google_classroom_sync;
drop policy if exists "admin_bypass_update" on public.google_classroom_sync;
drop policy if exists "require_privileged_aal2" on public.google_classroom_sync;
create policy "classroom_sync_owner_read" on public.google_classroom_sync
  for select to authenticated using ((select auth.uid()) = user_id);

insert into public.integrations (slug, integration, status, is_active, note, updated_at)
values ('google-classroom', 'Google Classroom', 'not_configured', false, 'OAuth authorization and a successful bounded sync are required.', now())
on conflict (slug) do nothing;
