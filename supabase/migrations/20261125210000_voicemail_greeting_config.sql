-- Voicemail greeting configuration: what a caller hears when a call lands
-- in voicemail, editable from the Admin dashboard (Communications Hub →
-- Phone → "Voicemail greeting").
--
-- Each greeting slot can be set two ways (voicemail_greeting_mode):
--   'text'      — the admin typed the greeting; the phone system speaks it
--                 with text-to-speech.
--   'recording' — the admin recorded their own voice in the dashboard; the
--                 audio file (voicemail_greeting_recording_path, in the
--                 private `phone-greetings` storage bucket) is played.
--
-- Slots:
--   phone_systems              — the default greeting for the whole phone
--                                system, including the operator mailbox.
--   communication_extensions   — an optional per-extension override. The
--                                voicemail_greeting text column already
--                                exists there; this adds its mode and
--                                recording path so both ways work per person.
--
-- The dashboard only stores these settings. The PBX-side applier
-- (scripts/gcp/apply-voicemail-greetings.py) reads them and installs each
-- mailbox's greeting audio where Asterisk's voicemail looks for it.
-- Application code treats missing columns as "no greeting configured"
-- (Asterisk's stock prompts), so the code is safe before or after this
-- migration — but a greeting can only be saved once this has been applied.
-- NOT YET APPLIED ANYWHERE: per standing rule, migrations are tested in QA
-- before merge/application to production.
ALTER TABLE public.phone_systems
  ADD COLUMN IF NOT EXISTS voicemail_greeting text,
  ADD COLUMN IF NOT EXISTS voicemail_greeting_mode text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS voicemail_greeting_recording_path text;

ALTER TABLE public.phone_systems
  DROP CONSTRAINT IF EXISTS phone_systems_voicemail_greeting_mode_check;
ALTER TABLE public.phone_systems
  ADD CONSTRAINT phone_systems_voicemail_greeting_mode_check
  CHECK (voicemail_greeting_mode IN ('text', 'recording'));

ALTER TABLE public.communication_extensions
  ADD COLUMN IF NOT EXISTS voicemail_greeting_mode text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS voicemail_greeting_recording_path text;

ALTER TABLE public.communication_extensions
  DROP CONSTRAINT IF EXISTS communication_extensions_voicemail_greeting_mode_check;
ALTER TABLE public.communication_extensions
  ADD CONSTRAINT communication_extensions_voicemail_greeting_mode_check
  CHECK (voicemail_greeting_mode IN ('text', 'recording'));

COMMENT ON COLUMN public.phone_systems.voicemail_greeting IS
  'Default voicemail greeting text (spoken by text-to-speech when voicemail_greeting_mode = ''text''). NULL/empty = no custom greeting.';
COMMENT ON COLUMN public.phone_systems.voicemail_greeting_mode IS
  'How the default voicemail greeting is provided: ''text'' (typed, spoken by TTS) or ''recording'' (admin-recorded audio).';
COMMENT ON COLUMN public.phone_systems.voicemail_greeting_recording_path IS
  'Object path in the private phone-greetings storage bucket holding the recorded default greeting audio.';
COMMENT ON COLUMN public.communication_extensions.voicemail_greeting_mode IS
  'How this extension''s voicemail greeting is provided: ''text'' (typed, spoken by TTS) or ''recording'' (recorded audio).';
COMMENT ON COLUMN public.communication_extensions.voicemail_greeting_recording_path IS
  'Object path in the private phone-greetings storage bucket holding this extension''s recorded greeting audio.';

-- Recorded greetings: private bucket, audio only, small files. The Admin
-- dashboard uploads through the service-role client; the PBX applier reads
-- with the service key. No public access — a greeting is business audio,
-- but there is no reason for it to be world-readable.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'phone-greetings',
  'phone-greetings',
  false,
  2097152,
  ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav']
)
ON CONFLICT (id) DO NOTHING;
