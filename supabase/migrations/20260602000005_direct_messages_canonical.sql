-- direct_messages: canonicalize sender identity column.
--
-- The table had both user_id (original) and sender_id (added during
-- schema reconciliation). All app code (MessagesClient.tsx) exclusively
-- uses sender_id for reads, writes, and mark-as-read operations.
-- user_id is never referenced in any app code path.
--
-- Action: backfill sender_id from user_id, then drop user_id.

UPDATE public.direct_messages
SET sender_id = user_id
WHERE sender_id IS NULL AND user_id IS NOT NULL;

ALTER TABLE public.direct_messages
  DROP COLUMN IF EXISTS user_id;
