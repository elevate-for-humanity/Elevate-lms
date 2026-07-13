-- Add content JSONB column to curriculum_lessons for Tiptap block editor output.
-- script_text (plain text) is retained as a read-only archive; new edits write to content.
-- The lms_lessons view already exposes content from course_lessons — this aligns
-- curriculum_lessons to the same shape so both tables can be queried uniformly.

ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS content jsonb;

COMMENT ON COLUMN public.curriculum_lessons.content IS
  'Tiptap ProseMirror JSON document. Replaces script_text for new content edits. '
  'script_text is retained as a read-only archive for HVAC legacy content.';

-- Backfill: wrap existing script_text into a minimal Tiptap doc so the editor
-- can open old lessons without showing a blank canvas.
UPDATE public.curriculum_lessons
SET content = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', script_text)
      )
    )
  )
)
WHERE script_text IS NOT NULL
  AND content IS NULL;
