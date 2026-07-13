-- Course embeddings for AI institutional memory.
--
-- Stores vector embeddings for course content so the Studio AI panel
-- can retrieve relevant context before responding (RAG pattern).
--
-- Each row represents one embeddable unit: a lesson, module, standard,
-- policy, or competency. Tagged with metadata for filtered retrieval.
--
-- Vector dimension: 1536 (OpenAI text-embedding-3-small / ada-002 compatible).

CREATE TABLE IF NOT EXISTS public.course_embeddings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source identifiers
  course_id       uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id       uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  lesson_id       uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,

  -- Content classification
  content_type    text NOT NULL CHECK (content_type IN (
    'lesson', 'module', 'course', 'quiz_question',
    'standard', 'competency', 'policy', 'employer_requirement',
    'video_transcript', 'learning_objective'
  )),

  -- The text that was embedded (for debugging / re-embedding)
  source_text     text NOT NULL,

  -- The embedding vector (1536 dims — OpenAI text-embedding-3-small)
  embedding       vector(1536) NOT NULL,

  -- Metadata for filtered retrieval
  metadata        jsonb NOT NULL DEFAULT '{}',
  -- Expected metadata keys:
  --   courseId, moduleId, lessonId, lessonType, credential,
  --   industry, state, governingBody, standardVersion, tags[]

  -- Embedding provenance
  model           text NOT NULL DEFAULT 'text-embedding-3-small',
  token_count     integer,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- HNSW index for fast approximate nearest-neighbor search
-- ef_construction=128, m=16 are good defaults for this scale
CREATE INDEX IF NOT EXISTS idx_course_embeddings_vector
  ON public.course_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 128);

-- Filtered retrieval indexes
CREATE INDEX IF NOT EXISTS idx_course_embeddings_course_id
  ON public.course_embeddings (course_id);

CREATE INDEX IF NOT EXISTS idx_course_embeddings_content_type
  ON public.course_embeddings (content_type);

CREATE INDEX IF NOT EXISTS idx_course_embeddings_lesson_id
  ON public.course_embeddings (lesson_id)
  WHERE lesson_id IS NOT NULL;

-- GIN index on metadata for tag/credential filtering
CREATE INDEX IF NOT EXISTS idx_course_embeddings_metadata
  ON public.course_embeddings USING gin (metadata);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_course_embeddings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_embeddings_updated_at ON public.course_embeddings;
CREATE TRIGGER trg_course_embeddings_updated_at
  BEFORE UPDATE ON public.course_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.update_course_embeddings_updated_at();

-- RLS: service role only — embeddings are internal infrastructure
ALTER TABLE public.course_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on course_embeddings" ON public.course_embeddings;
CREATE POLICY "Service role full access on course_embeddings"
  ON public.course_embeddings
  USING (auth.role() = 'service_role');

-- Similarity search function — used by Studio AI panel for RAG retrieval
CREATE OR REPLACE FUNCTION public.search_course_embeddings(
  query_embedding   vector(1536),
  p_course_id       uuid DEFAULT NULL,
  p_content_types   text[] DEFAULT NULL,
  p_limit           integer DEFAULT 5,
  p_threshold       float DEFAULT 0.75
)
RETURNS TABLE (
  id            uuid,
  course_id     uuid,
  lesson_id     uuid,
  content_type  text,
  source_text   text,
  metadata      jsonb,
  similarity    float
)
LANGUAGE sql STABLE AS $$
  SELECT
    ce.id,
    ce.course_id,
    ce.lesson_id,
    ce.content_type,
    ce.source_text,
    ce.metadata,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM public.course_embeddings ce
  WHERE
    (p_course_id IS NULL OR ce.course_id = p_course_id)
    AND (p_content_types IS NULL OR ce.content_type = ANY(p_content_types))
    AND 1 - (ce.embedding <=> query_embedding) >= p_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT p_limit;
$$;
