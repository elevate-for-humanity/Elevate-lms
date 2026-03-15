-- Content review status workflow
--
-- Adds 'pending_review' as a first-class status on training_courses and
-- curriculum_lessons, enabling a human approval gate between generation
-- and live publication.
--
-- State machine:
--   draft → pending_review → published
--                          ↘ rejected → draft (revise and resubmit)
--
-- The publish route sets status='pending_review' when auto_publish=false
-- and a program_id is present. An admin review step promotes to 'published'
-- or 'rejected'. Direct draft→published is still allowed for admin-created
-- content that does not require partner review.
--
-- CHECK constraints are added for both tables. Existing unconstrained values
-- ('active', 'inactive', 'archived') are included so legacy rows are not
-- broken by the constraint.

-- ── 1. training_courses ───────────────────────────────────────────────────────

ALTER TABLE training_courses
  DROP CONSTRAINT IF EXISTS chk_training_courses_status;

ALTER TABLE training_courses
  ADD CONSTRAINT chk_training_courses_status
  CHECK (status IS NULL OR status IN (
    'draft',
    'pending_review',
    'published',
    'rejected',
    'active',      -- legacy synonym for published
    'inactive',    -- legacy
    'archived'     -- legacy
  ));

ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS review_submitted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at          timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes         text;

COMMENT ON COLUMN training_courses.review_submitted_at IS
  'When the course was submitted for review (status set to pending_review).';
COMMENT ON COLUMN training_courses.reviewed_by IS
  'Admin or staff who approved or rejected the course.';
COMMENT ON COLUMN training_courses.reviewed_at IS
  'When the review decision was made.';
COMMENT ON COLUMN training_courses.review_notes IS
  'Admin notes on the review decision. Required when status = rejected.';

-- ── 2. curriculum_lessons ─────────────────────────────────────────────────────

ALTER TABLE curriculum_lessons
  DROP CONSTRAINT IF EXISTS chk_curriculum_lessons_status;

ALTER TABLE curriculum_lessons
  ADD CONSTRAINT chk_curriculum_lessons_status
  CHECK (status IN (
    'draft',
    'pending_review',
    'published',
    'rejected'
  ));

ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS review_submitted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at          timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes         text;

COMMENT ON COLUMN curriculum_lessons.review_submitted_at IS
  'When the lesson was submitted for review.';
COMMENT ON COLUMN curriculum_lessons.reviewed_by IS
  'Admin or staff who approved or rejected the lesson.';
COMMENT ON COLUMN curriculum_lessons.reviewed_at IS
  'When the review decision was made.';
COMMENT ON COLUMN curriculum_lessons.review_notes IS
  'Admin notes. Required when status = rejected.';

-- ── 3. Indexes for admin review queue ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_training_courses_pending_review
  ON training_courses (review_submitted_at)
  WHERE status = 'pending_review';

CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_pending_review
  ON curriculum_lessons (review_submitted_at)
  WHERE status = 'pending_review';
