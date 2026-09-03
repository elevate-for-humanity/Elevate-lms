-- messages: add columns from later definition without dropping existing ones.
--
-- Live has: id, sender_id, recipient_id, subject, body, read, read_at,
--           created_at, conversation_id, deleted_by, read_by
-- App references: read (12), conversation_id (6), read_by (5), deleted_by (4),
--                 is_read (3) — mixed usage of both old and new column names.
--
-- Strategy: add new columns additively. Do NOT drop read/conversation_id/
-- deleted_by/read_by — 12+ app references depend on them.
-- App code using is_read (3 refs) will work once the column exists.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thread_id  UUID,
  ADD COLUMN IF NOT EXISTS parent_id  UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill is_read from read for existing rows
UPDATE public.messages
SET is_read = COALESCE(read, false)
WHERE is_read = false AND read IS NOT NULL;
