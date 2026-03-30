-- Three fixes identified during RLS policy alignment audit:
--
-- 1. direct_message_conversations: live table has columns 'add' and
--    'elevateforhumanity' from a malformed migration. App expects
--    participant_1_id, participant_2_id, last_message_at, last_message_preview.
--    Drop the garbage columns, add the real ones.
--
-- 2. provider_onboarding_steps: policy only allowed admin writes, but
--    provider/settings and provider/programs/create routes use createClient()
--    (user-scoped) to UPDATE steps for their own tenant. Add tenant-scoped
--    UPDATE policy for provider_admin role.
--
-- 3. provider_program_approvals: policy only allowed admin writes, but
--    provider/programs/create and provider/programs/submit routes use
--    createClient() to INSERT approval records for their own tenant. Add
--    tenant-scoped INSERT policy for provider_admin role.
--
-- 4. direct_messages: RLS was never enabled. Any authenticated user could
--    read all messages. Enable RLS and add sender/conversation-participant
--    scoped policies.

-- ─── 1. direct_message_conversations schema fix ──────────────────────────────

ALTER TABLE public.direct_message_conversations
  DROP COLUMN IF EXISTS add,
  DROP COLUMN IF EXISTS elevateforhumanity,
  ADD COLUMN IF NOT EXISTS participant_1_id uuid,
  ADD COLUMN IF NOT EXISTS participant_2_id uuid,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_message_preview text;

-- ─── 2. provider_onboarding_steps: add tenant-scoped UPDATE ──────────────────
--
-- provider/settings and provider/programs/create call:
--   supabase.from('provider_onboarding_steps')
--     .update({ completed: true, ... })
--     .eq('tenant_id', tenantId)
--     .eq('step', '...')
-- using createClient() (user JWT, not service role).
-- The existing policy only allows admin INSERT/UPDATE/DELETE, so these
-- writes were silently failing (RLS blocks, no error surfaced to UI).

CREATE POLICY "provider_onboarding_steps_tenant_update"
  ON public.provider_onboarding_steps
  FOR UPDATE
  USING (tenant_id = public.my_tenant_id());

-- ─── 3. provider_program_approvals: add tenant-scoped INSERT ─────────────────
--
-- provider/programs/create inserts an approval record via createClient():
--   supabase.from('provider_program_approvals').insert({ tenant_id, ... })
-- provider/programs/submit also inserts via createClient() after auth check.
-- Both were blocked by the admin-only INSERT policy.

CREATE POLICY "provider_program_approvals_tenant_insert"
  ON public.provider_program_approvals
  FOR INSERT
  WITH CHECK (tenant_id = public.my_tenant_id());

-- ─── 4. direct_messages: enable RLS + add policies ───────────────────────────
--
-- Access model:
--   - A user can read messages in conversations they participate in.
--     Scoped via direct_message_conversations.participant_1_id / participant_2_id.
--   - A user can insert messages into conversations they participate in,
--     and only as themselves (sender_id = auth.uid()).
--   - A user can update their own messages (e.g. mark-as-read updates
--     issued by the recipient are scoped to neq sender_id, so the UPDATE
--     policy must allow the conversation participant, not just the sender).
--   - Admin can read/write all.

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Helper: returns true if the caller is a participant in the given conversation.
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.direct_message_conversations
    WHERE id = p_conversation_id
      AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  )
$$;

CREATE POLICY "direct_messages_participant_read"
  ON public.direct_messages
  FOR SELECT
  USING (
    public.is_conversation_participant(conversation_id)
    OR public.is_admin_role()
  );

-- Sender inserts their own messages into conversations they belong to.
CREATE POLICY "direct_messages_sender_insert"
  ON public.direct_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id)
  );

-- Mark-as-read: MessagesClient updates is_read=true for messages in a
-- conversation where sender_id != current user (i.e. the recipient marks
-- the other person's messages as read). Policy must allow any participant
-- to update, not just the sender.
CREATE POLICY "direct_messages_participant_update"
  ON public.direct_messages
  FOR UPDATE
  USING (
    public.is_conversation_participant(conversation_id)
    OR public.is_admin_role()
  );

CREATE POLICY "direct_messages_admin_delete"
  ON public.direct_messages
  FOR DELETE
  USING (public.is_admin_role());

-- ─── direct_message_conversations: enable RLS ────────────────────────────────

ALTER TABLE public.direct_message_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "direct_message_conversations_participant_read"
  ON public.direct_message_conversations
  FOR SELECT
  USING (
    participant_1_id = auth.uid()
    OR participant_2_id = auth.uid()
    OR public.is_admin_role()
  );

-- Either participant can update (last_message_at / last_message_preview
-- is written by the sender after inserting a message).
CREATE POLICY "direct_message_conversations_participant_update"
  ON public.direct_message_conversations
  FOR UPDATE
  USING (
    participant_1_id = auth.uid()
    OR participant_2_id = auth.uid()
    OR public.is_admin_role()
  );

-- Only admin creates conversations (or a future "start conversation" API).
CREATE POLICY "direct_message_conversations_admin_insert"
  ON public.direct_message_conversations
  FOR INSERT
  WITH CHECK (public.is_admin_role());

CREATE POLICY "direct_message_conversations_admin_delete"
  ON public.direct_message_conversations
  FOR DELETE
  USING (public.is_admin_role());
