-- Repair the canonical cosmetology course's missing self-paced instructional
-- durations using the same lesson-type defaults as the Course Factory hours
-- engine. These values are learning-time estimates only. They do not award,
-- verify, or substitute for registered-apprenticeship RTI/OJL hours.

update public.course_lessons as lesson
set duration_minutes = case lesson.lesson_type::text
      when 'checkpoint' then 15
      when 'quiz' then 20
      when 'lab' then 60
      when 'practical' then 60
      when 'exam' then 90
      when 'video' then 20
      when 'reading' then 20
      else 30
    end,
    updated_at = now()
from public.courses as course
where lesson.course_id = course.id
  and course.slug = 'cosmetology-apprenticeship'
  and lesson.duration_minutes is null;

-- Keep AI-authored material in human review after its authoring metadata changes.
update public.courses
set review_status = 'draft',
    submitted_for_review_at = null,
    submitted_by = null,
    reviewed_at = null,
    reviewed_by = null,
    review_notes = concat_ws(E'\n', nullif(review_notes, ''),
      'Instructional duration estimates normalized; regulated RTI/OJL credit remains subject to the active approved standard and authorized human verification.'),
    updated_at = now()
where slug = 'cosmetology-apprenticeship';
