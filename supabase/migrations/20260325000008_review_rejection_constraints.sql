-- Review workflow enforcement constraints
--
-- Adds CHECK constraints that make the review workflow self-enforcing at the
-- DB level. Without these, the pending_review/rejected states added in
-- migration 007 are documentation, not rules.
--
-- Rules enforced:
--   1. training_courses: rejected rows must have reviewed_at and review_notes
--   2. curriculum_lessons: rejected rows must have reviewed_at and review_notes
--   3. training_courses: published rows must have is_published = true
--      (prevents status/flag drift where status='published' but is_published=false)
--
-- These constraints fire on INSERT and UPDATE, so sloppy writes that bypass
-- the API layer are caught at the DB level.

-- ── 1. training_courses: rejection requires reviewer metadata ─────────────────

ALTER TABLE training_courses
  DROP CONSTRAINT IF EXISTS chk_tc_rejection_complete;

ALTER TABLE training_courses
  ADD CONSTRAINT chk_tc_rejection_complete
  CHECK (
    status != 'rejected'
    OR (reviewed_at IS NOT NULL AND review_notes IS NOT NULL AND review_notes != '')
  );

COMMENT ON CONSTRAINT chk_tc_rejection_complete ON training_courses IS
  'A rejected course must have reviewed_at and a non-empty review_notes. '
  'Prevents silent rejections with no audit trail.';

-- ── 2. curriculum_lessons: rejection requires reviewer metadata ───────────────

ALTER TABLE curriculum_lessons
  DROP CONSTRAINT IF EXISTS chk_cl_rejection_complete;

ALTER TABLE curriculum_lessons
  ADD CONSTRAINT chk_cl_rejection_complete
  CHECK (
    status != 'rejected'
    OR (reviewed_at IS NOT NULL AND review_notes IS NOT NULL AND review_notes != '')
  );

COMMENT ON CONSTRAINT chk_cl_rejection_complete ON curriculum_lessons IS
  'A rejected lesson must have reviewed_at and a non-empty review_notes.';

-- ── 3. training_courses: status/is_published consistency ─────────────────────
--
-- Prevents the common drift where status='published' but is_published=false
-- (or vice versa). The source of truth is status; is_published is a derived
-- boolean kept for legacy query compatibility.
--
-- Allowed combinations:
--   status='published'      → is_published must be true
--   status='pending_review' → is_published must be false (not yet approved)
--   status='draft'          → is_published must be false
--   status='rejected'       → is_published must be false
--   status=anything else    → no constraint (legacy rows)

ALTER TABLE training_courses
  DROP CONSTRAINT IF EXISTS chk_tc_status_flag_consistency;

ALTER TABLE training_courses
  ADD CONSTRAINT chk_tc_status_flag_consistency
  CHECK (
    status IS NULL
    OR status NOT IN ('published', 'pending_review', 'draft', 'rejected')
    OR (
      (status = 'published'      AND is_published = true)
      OR (status = 'pending_review' AND (is_published = false OR is_published IS NULL))
      OR (status = 'draft'          AND (is_published = false OR is_published IS NULL))
      OR (status = 'rejected'       AND (is_published = false OR is_published IS NULL))
    )
  );

COMMENT ON CONSTRAINT chk_tc_status_flag_consistency ON training_courses IS
  'is_published must be true when status=published, false otherwise. '
  'Prevents status/flag drift in legacy query paths.';
