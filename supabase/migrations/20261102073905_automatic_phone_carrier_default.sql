-- New assigned phones use Elevate's active PBX without a carrier-migration step.
-- Existing ownership, ring preferences, presence, and learner records are unchanged.
set lock_timeout = '5s';
alter table public.communication_extensions
  alter column webrtc_provider set default 'asterisk';
