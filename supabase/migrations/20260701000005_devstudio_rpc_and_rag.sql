-- Dev Studio support objects
--
-- 1. devstudio_append_log RPC — atomically appends lines to devstudio_jobs.log_lines
-- 2. rag_documents table — stores uploaded documents for RAG context in Dev Studio AI Chat

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. devstudio_append_log
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.devstudio_jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.devstudio_append_log(
  p_job_id  uuid,
  p_lines   text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.devstudio_jobs
  SET log_lines = COALESCE(log_lines, '[]'::jsonb) || to_jsonb(p_lines)
  WHERE id = p_job_id;
END;
$$;

COMMENT ON FUNCTION public.devstudio_append_log IS
  'Atomically appends an array of log lines to devstudio_jobs.log_lines. '
  'Called by /api/devstudio/jobs PATCH to stream command output.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. rag_documents
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rag_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  filename     text NOT NULL,
  content_text text,
  file_url     text,
  file_size    int,
  mime_type    text,
  category     text DEFAULT 'general',
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rag_documents_user_id_idx ON public.rag_documents(user_id);
CREATE INDEX IF NOT EXISTS rag_documents_category_idx ON public.rag_documents(category);
CREATE INDEX IF NOT EXISTS rag_documents_created_at_idx ON public.rag_documents(created_at DESC);

COMMENT ON TABLE public.rag_documents IS
  'Documents uploaded via Dev Studio for RAG context injection into AI Chat. '
  'Content is chunked and embedded into rag_embeddings for semantic search.';

-- RLS: admins can read/write all; users can only read their own
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_all_rag_documents" ON public.rag_documents;
DROP POLICY IF EXISTS "users_own_rag_documents"  ON public.rag_documents;

CREATE POLICY "admins_all_rag_documents"
  ON public.rag_documents FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
  ));

CREATE POLICY "users_own_rag_documents"
  ON public.rag_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid());
