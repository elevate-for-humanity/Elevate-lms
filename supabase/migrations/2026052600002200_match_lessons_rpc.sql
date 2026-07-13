-- match_lessons RPC for pgvector semantic search.
-- Used by lib/embeddings/embed-lessons.ts searchLessons().
-- Replaces the raw query_json workaround.

CREATE OR REPLACE FUNCTION match_lessons(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_course_id uuid DEFAULT NULL
)
RETURNS TABLE (
  lesson_id uuid,
  course_id uuid,
  source_text text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ce.lesson_id,
    ce.course_id,
    ce.source_text,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM course_embeddings ce
  WHERE
    ce.lesson_id IS NOT NULL
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
    AND (filter_course_id IS NULL OR ce.course_id = filter_course_id)
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
$$;
