-- Reconcile the original per-lesson generation constraint with the lifecycle
-- used by the canonical Course Factory, governance, recovery, and publish paths.
-- The 20260622 migration used ADD COLUMN IF NOT EXISTS, so it could not replace
-- the constraint installed when generation_status was first introduced.

alter table public.course_lessons
  drop constraint if exists course_lessons_generation_status_check;

alter table public.course_lessons
  add constraint course_lessons_generation_status_check
  check (
    generation_status in (
      'queued',
      'draft',
      'generating',
      'structure_seeded',
      'content_pending',
      'content_hydrated',
      'assessment_ready',
      'generated',
      'verification_ready',
      'certificate_ready',
      'approved',
      'complete',
      'completed',
      'failed_retryable',
      'published'
    )
  ) not valid;

alter table public.course_lessons
  validate constraint course_lessons_generation_status_check;

comment on column public.course_lessons.generation_status is
  'Canonical lesson production lifecycle shared by Course Factory, governance, recovery, review, and publishing.';
