-- Add quiz_questions, topics, and content_type to the lessons VIEW
-- so the LMS lesson page can render quizzes inline.

-- Ensure columns exist on training_lessons
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'video';
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS quiz_id UUID;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70;
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS description TEXT;

-- Recreate lessons VIEW with quiz fields
DROP VIEW IF EXISTS lessons CASCADE;

CREATE VIEW lessons AS
SELECT
  id,
  COALESCE(course_id_uuid, id) AS course_id,
  title,
  content,
  description,
  video_url,
  lesson_number,
  order_index,
  duration_minutes,
  is_required,
  is_published,
  content_type,
  quiz_id,
  quiz_questions,
  passing_score,
  topics,
  created_at,
  updated_at
FROM training_lessons;

-- Restore writable rules
CREATE OR REPLACE RULE lessons_insert AS ON INSERT TO lessons
DO INSTEAD INSERT INTO training_lessons (
  course_id_uuid, title, content, description, video_url, lesson_number, order_index,
  duration_minutes, is_required, is_published, content_type, quiz_id, quiz_questions,
  passing_score, topics
) VALUES (
  NEW.course_id, NEW.title, NEW.content, NEW.description, NEW.video_url, NEW.lesson_number,
  NEW.order_index, NEW.duration_minutes, NEW.is_required, NEW.is_published, NEW.content_type,
  NEW.quiz_id, NEW.quiz_questions, NEW.passing_score, NEW.topics
);

CREATE OR REPLACE RULE lessons_update AS ON UPDATE TO lessons
DO INSTEAD UPDATE training_lessons SET
  title = NEW.title,
  content = NEW.content,
  description = NEW.description,
  video_url = NEW.video_url,
  lesson_number = NEW.lesson_number,
  order_index = NEW.order_index,
  duration_minutes = NEW.duration_minutes,
  is_required = NEW.is_required,
  is_published = NEW.is_published,
  content_type = NEW.content_type,
  quiz_id = NEW.quiz_id,
  quiz_questions = NEW.quiz_questions,
  passing_score = NEW.passing_score,
  topics = NEW.topics,
  updated_at = NOW()
WHERE id = OLD.id;

CREATE OR REPLACE RULE lessons_delete AS ON DELETE TO lessons
DO INSTEAD DELETE FROM training_lessons WHERE id = OLD.id;

-- Grant permissions
GRANT SELECT ON lessons TO authenticated;
GRANT SELECT ON lessons TO anon;
