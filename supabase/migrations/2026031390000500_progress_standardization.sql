-- ============================================================
-- Progress Field Standardization
-- Canonical field: progress_percent (integer)
-- ============================================================

-- 1. Remove unused lesson_progress.percent (always NULL)
ALTER TABLE lesson_progress DROP COLUMN IF EXISTS percent;

-- 2. Ensure lesson_progress.progress_percent is integer
-- (already is, but enforce NOT NULL with default)
ALTER TABLE lesson_progress
  ALTER COLUMN progress_percent SET DEFAULT 0;

-- 3. Backfill program_enrollments.progress_percent from progress where NULL
UPDATE program_enrollments
SET progress_percent = COALESCE(progress::integer, 0)
WHERE progress_percent IS NULL AND progress IS NOT NULL;

-- 4. Add program_id to lesson_progress for direct program queries
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- 5. Populate course_progress from lesson_progress aggregation
-- Only runs if course_progress has a progress_percent column
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_progress' AND column_name = 'progress_percent'
  ) THEN
    INSERT INTO course_progress (user_id, course_id, progress_percent, completed, updated_at)
    SELECT
      lp.user_id,
      lp.course_id,
      ROUND(AVG(lp.progress_percent))::integer,
      BOOL_AND(lp.completed),
      MAX(lp.updated_at)
    FROM lesson_progress lp
    WHERE lp.course_id IS NOT NULL
    GROUP BY lp.user_id, lp.course_id
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      progress_percent = EXCLUDED.progress_percent,
      completed = EXCLUDED.completed,
      updated_at = EXCLUDED.updated_at;
  END IF;
END $$;
