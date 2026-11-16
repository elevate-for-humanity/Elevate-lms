-- Recording-only outage alerts and recovered transcripts need distinct claims.
-- Existing claims, recipients, foreign keys, RLS and grants remain unchanged.
set local lock_timeout = '5s';
alter table public.phone_notification_deliveries
  drop constraint phone_notification_deliveries_message_kind_check,
  add constraint phone_notification_deliveries_message_kind_check
    check (message_kind in ('paris','voicemail','voicemail_recording'));
