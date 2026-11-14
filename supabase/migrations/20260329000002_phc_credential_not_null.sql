-- Migration 006: program_holder_courses.credential_id NOT NULL
-- Pre-condition: SELECT COUNT(*) FROM program_holder_courses WHERE credential_id IS NULL = 0
-- Applied after verifying zero null rows.

ALTER TABLE program_holder_courses ALTER COLUMN credential_id SET NOT NULL;
