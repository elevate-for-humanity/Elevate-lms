-- Durable document context for the unified Admin AI Studio.
-- Background tasks resolve content by document UUID instead of expiring URLs.
ALTER TABLE public.devstudio_documents
  ADD COLUMN IF NOT EXISTS extracted_text text,
  ADD COLUMN IF NOT EXISTS extraction_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.devstudio_documents
  DROP CONSTRAINT IF EXISTS devstudio_documents_extraction_status_check;

ALTER TABLE public.devstudio_documents
  ADD CONSTRAINT devstudio_documents_extraction_status_check
  CHECK (extraction_status IN ('pending', 'complete', 'unavailable', 'failed'));

CREATE INDEX IF NOT EXISTS devstudio_documents_extraction_status_idx
  ON public.devstudio_documents(extraction_status, created_at DESC);

COMMENT ON COLUMN public.devstudio_documents.extracted_text IS
  'Server-extracted document text used by Studio tasks through the durable document UUID.';

ALTER TABLE public.ai_tasks
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.studio_conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ai_tasks_conversation_id_created_at_idx
  ON public.ai_tasks(conversation_id, created_at DESC);

COMMENT ON COLUMN public.ai_tasks.conversation_id IS
  'Conversation timeline that owns this execution record in the unified Admin AI Studio.';
