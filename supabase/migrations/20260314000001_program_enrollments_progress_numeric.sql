-- Ensure program_enrollments.progress is NUMERIC(5,2).
-- Only cast if the column is still text; if already numeric this is a no-op.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'program_enrollments'
      AND column_name = 'progress'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE program_enrollments
      ALTER COLUMN progress TYPE NUMERIC(5,2)
      USING CASE
        WHEN progress ~ '^[0-9]+(\.[0-9]+)?$' THEN progress::NUMERIC(5,2)
        ELSE NULL
      END;
  END IF;
END $$;

-- Add 0-100 range constraint if not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'program_enrollments'
      AND constraint_name = 'progress_range'
  ) THEN
    ALTER TABLE program_enrollments
      ADD CONSTRAINT progress_range CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100));
  END IF;
END $$;
