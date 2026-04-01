-- Course generation control fields
-- Adds draft/generating/review/published lifecycle to courses
-- and queued/generating/generated/approved lifecycle to course_lessons.
-- Enables incremental generation with per-lesson lock and approve controls.

-- courses: generation lifecycle
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS generation_status   text    NOT NULL DEFAULT 'draft'
    CHECK (generation_status IN ('draft', 'generating', 'review', 'published')),
  ADD COLUMN IF NOT EXISTS generation_progress integer NOT NULL DEFAULT 0
    CHECK (generation_progress BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS generation_paused   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS generator_prompt    text,
  ADD COLUMN IF NOT EXISTS last_generated_at   timestamptz;

-- course_lessons: per-lesson edit control
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS generation_status  text    NOT NULL DEFAULT 'queued'
    CHECK (generation_status IN ('queued', 'generating', 'generated', 'approved')),
  ADD COLUMN IF NOT EXISTS locked             boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_generated       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS generator_prompt   text,
  ADD COLUMN IF NOT EXISTS last_generated_at  timestamptz;

-- Index for fast lookup of unlocked/unapproved lessons during generation
CREATE INDEX IF NOT EXISTS idx_course_lessons_generation
  ON public.course_lessons (course_id, generation_status, locked, approved);
