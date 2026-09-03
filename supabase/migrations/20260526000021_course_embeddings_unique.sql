-- Unique index on course_embeddings for upsert support.
-- Allows embedCourseLessons() to upsert without duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS course_embeddings_lesson_content_uniq
  ON course_embeddings(course_id, lesson_id, content_type)
  WHERE lesson_id IS NOT NULL;
