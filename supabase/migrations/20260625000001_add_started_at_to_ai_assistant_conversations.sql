-- Add started_at column to ai_assistant_conversations table
-- This column is required by the AI assistant feature for tracking conversation start times

ALTER TABLE public.ai_assistant_conversations
ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();

-- Backfill started_at for existing conversations that have created_at
UPDATE public.ai_assistant_conversations
SET started_at = created_at
WHERE started_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.ai_assistant_conversations.started_at IS 'Timestamp when the conversation was started/activated';
