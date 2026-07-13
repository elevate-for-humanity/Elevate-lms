-- Publish 5 Peer Recovery Specialist lessons that have real content and a program_id.
-- The remaining ~195 draft lessons with no program_id are empty shells (no script_text,
-- no video_file) and intentionally remain draft until content is added.
UPDATE public.curriculum_lessons
SET status = 'published'
WHERE program_id = 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d'
  AND status = 'draft';
