-- Clean schema drift: remove unused lesson_progress.percent column.
-- The active column is progress_percent (integer, always populated).
-- lesson_progress.percent is always NULL — no code references it.

ALTER TABLE lesson_progress DROP COLUMN IF EXISTS percent;

-- Note: program_enrollments has both 'progress' and 'progress_percent'.
-- Both are actively used by different pages. Do NOT drop either.
-- Future consolidation should migrate all reads to progress_percent
-- and backfill progress_percent from progress where NULL.
