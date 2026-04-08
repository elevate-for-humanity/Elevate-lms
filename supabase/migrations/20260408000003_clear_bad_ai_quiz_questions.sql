-- Clear AI-hallucinated Excel quiz questions from two HVAC course lessons.
--
-- These rows were seeded by the AI ingest pipeline with wrong content (Excel questions
-- in HVAC lessons) and wrong shape ({question_text, correct_answer, points, question_type}
-- instead of the canonical {question, options, correctAnswer, explanation}).
--
-- The lessons are lab/reading types that don't require quiz questions.
-- Clearing quiz_questions removes the broken quiz tab from those lessons.

UPDATE public.course_lessons
SET quiz_questions = NULL
WHERE id IN (
  '78c332e4-5725-4813-b246-584473151d78',  -- Multimeter & Amp Clamp Lab
  'd17856eb-7e55-41cd-9557-44ec15812b06'   -- Reading Wiring Diagrams & Schematics
)
  AND quiz_questions IS NOT NULL
  -- Safety check: only clear if the shape is the AI-ingest shape (has question_text key)
  AND (quiz_questions->0->>'question_text') IS NOT NULL;
