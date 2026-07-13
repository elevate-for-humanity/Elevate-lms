-- program_holder_courses: enforce credential_id NOT NULL
--
-- Run AFTER migration 005 has been applied AND the backfill has completed.
--
-- Before running, verify all rows have a credential_id:
--
--   SELECT COUNT(*) FROM program_holder_courses WHERE credential_id IS NULL;
--
-- If that returns 0, this migration is safe to apply.
-- If it returns > 0, the rows have no matching training_courses.credential_id
-- and must be resolved manually before this constraint can be added.
--
-- The constraint prevents new course assignments from being created without
-- a credential reference, closing the structural hole where partners could
-- upload syllabi with no blueprint anchor.

DO $$ BEGIN
  -- Safety check: refuse to add NOT NULL if any rows would violate it
  IF EXISTS (
    SELECT 1 FROM program_holder_courses WHERE credential_id IS NULL LIMIT 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add NOT NULL constraint: % rows in program_holder_courses have NULL credential_id. '
      'Resolve these rows first, then re-run this migration.',
      (SELECT COUNT(*) FROM program_holder_courses WHERE credential_id IS NULL);
  END IF;
END $$;

ALTER TABLE program_holder_courses
  ALTER COLUMN credential_id SET NOT NULL;

COMMENT ON COLUMN program_holder_courses.credential_id IS
  'The credential this course assignment prepares for. NOT NULL — every '
  'course assignment must reference a credential with exam domains defined. '
  'Backfilled and kept in sync by trg_phc_sync_credential_id.';
