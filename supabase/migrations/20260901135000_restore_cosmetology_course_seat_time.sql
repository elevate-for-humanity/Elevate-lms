-- Restore the canonical Cosmetology course's self-paced instructional duration
-- after governance temporarily copied the linked apprenticeship program total.
-- Registered RTI and OJL requirements remain in their standards records.

update public.courses c
set duration_hours = lesson_time.duration_hours,
    updated_at = now()
from (
  select course_id, round(sum(duration_minutes)::numeric / 60.0, 2) as duration_hours
  from public.course_lessons
  where duration_minutes is not null
  group by course_id
) lesson_time
where c.id = lesson_time.course_id
  and c.slug = 'cosmetology-apprenticeship'
  and lesson_time.duration_hours > 0;
