set lock_timeout='2s'; set statement_timeout='30s';
alter policy applicant_outreach_admin_read on public.applicant_outreach_contacts using (exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('admin','super_admin')));
alter policy applicant_outreach_reply_admin_read on public.applicant_outreach_replies using (exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('admin','super_admin')));
alter policy pwa_alert_preferences_own on public.pwa_alert_preferences using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
