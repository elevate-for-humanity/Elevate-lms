-- Allow curriculum_lessons.program_id to be NULL.
-- AI-generated courses are not always linked to a program at creation time.
-- program_id is set later when the course is assigned to a program.

alter table public.curriculum_lessons
  alter column program_id drop not null;
