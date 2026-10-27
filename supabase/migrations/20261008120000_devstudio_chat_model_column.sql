-- Preserve the model identifier recorded by streamed Dev Studio chat.
-- Additive, idempotent, and does not modify existing chat records.
ALTER TABLE public.devstudio_chat_log
  ADD COLUMN IF NOT EXISTS model text;
