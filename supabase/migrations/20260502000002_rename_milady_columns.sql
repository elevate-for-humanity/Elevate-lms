-- Rename milady_* columns to lms_* equivalents.
-- Milady is no longer used; theory instruction is delivered via Elevate LMS.

-- program_enrollments
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_enrollments'
      AND column_name = 'milady_enrolled'
  ) THEN
    ALTER TABLE public.program_enrollments
      RENAME COLUMN milady_enrolled TO lms_enrolled;
  END IF;
END $$;

-- student_enrollments
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'student_enrollments'
      AND column_name = 'milady_enrolled'
  ) THEN
    ALTER TABLE public.student_enrollments
      RENAME COLUMN milady_enrolled TO lms_enrolled;
  END IF;
END $$;

-- state_board_readiness
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'state_board_readiness'
      AND column_name = 'milady_completed'
  ) THEN
    ALTER TABLE public.state_board_readiness
      RENAME COLUMN milady_completed TO lms_completed;
  END IF;
END $$;
