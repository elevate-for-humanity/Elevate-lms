-- Canonical lesson embedding pipeline uses PostgREST upsert with
-- onConflict: course_id,lesson_id,content_type. A partial unique index is not
-- a reliable inference target for ON CONFLICT without a matching predicate.
-- Keep the existing partial index; add the non-partial unique target required
-- by the current embedCourseLessons() implementation.
CREATE UNIQUE INDEX IF NOT EXISTS course_embeddings_upsert_uniq
  ON public.course_embeddings(course_id, lesson_id, content_type);
