-- Add summary_text and reflection_prompt to curriculum_lessons.
--
-- summary_text: 1–3 sentence learner-facing preview, used by the audit scorer
--   and the learner UI lesson card.
-- reflection_prompt: open-ended question shown at end of lesson, used by the
--   audit scorer to verify instructional completeness.
--
-- Both default to '' so existing rows are unaffected.

ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS summary_text     text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reflection_prompt text NOT NULL DEFAULT '';

COMMENT ON COLUMN curriculum_lessons.summary_text IS
  '1–3 sentence learner-facing summary. Used by audit-alignment.ts completeness scoring.';

COMMENT ON COLUMN curriculum_lessons.reflection_prompt IS
  'Open-ended reflection question shown at end of lesson. Used by audit-alignment.ts completeness scoring.';
