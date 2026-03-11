-- Cast program_enrollments.progress from TEXT to NUMERIC(5,2)
-- Safe backfill: non-numeric values become NULL rather than erroring
ALTER TABLE program_enrollments
  ALTER COLUMN progress TYPE NUMERIC(5,2)
  USING CASE
    WHEN progress ~ '^[0-9]+(\.[0-9]+)?$' THEN progress::NUMERIC(5,2)
    ELSE NULL
  END;

-- Constrain to 0–100 range
ALTER TABLE program_enrollments
  ADD CONSTRAINT progress_range CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100));
