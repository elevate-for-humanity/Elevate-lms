begin;

-- 1) analytics_events: stop anonymous inserts (fast stopgap)
drop policy if exists "Anyone can insert events" on public.analytics_events;
drop policy if exists analytics_events_insert_authenticated on public.analytics_events;
create policy analytics_events_insert_authenticated
  on public.analytics_events
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 2) page_views: stop anonymous inserts (fast stopgap)
drop policy if exists "Anyone can insert page views" on public.page_views;
drop policy if exists page_views_insert_authenticated on public.page_views;
create policy page_views_insert_authenticated
  on public.page_views
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 3) conversions: stop anonymous inserts (fast stopgap)
drop policy if exists "System can insert conversions" on public.conversions;
drop policy if exists conversions_insert_authenticated on public.conversions;
create policy conversions_insert_authenticated
  on public.conversions
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 4) tax_document_uploads: stop anonymous inserts (fast stopgap)
drop policy if exists "anyone_insert" on public.tax_document_uploads;
drop policy if exists tax_document_uploads_insert_authenticated on public.tax_document_uploads;
create policy tax_document_uploads_insert_authenticated
  on public.tax_document_uploads
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL);

-- 5) notifications: KEEP SERVICE-ONLY behavior, but make it explicit and clean
-- Drop and recreate to ensure no other public-insert policy exists and to standardize the name
drop policy if exists "System can create notifications" on public.notifications;
drop policy if exists notifications_insert_service_only on public.notifications;
create policy notifications_insert_service_only
  on public.notifications
  for insert
  to public
  with check ((SELECT auth.role()) = 'service_role');

-- 6) audit_logs: remove NULL loophole; allow only self-insert when authenticated
drop policy if exists "Users can create own audit logs" on public.audit_logs;
drop policy if exists audit_logs_insert_self_only on public.audit_logs;
create policy audit_logs_insert_self_only
  on public.audit_logs
  for insert
  to authenticated
  with check ((SELECT auth.uid()) IS NOT NULL AND actor_id = (SELECT auth.uid()));

commit;
