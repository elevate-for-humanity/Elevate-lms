-- View: course_completion_status
-- Summarizes whether a student has completed all lessons in a course
--
-- This view joins enrollments → modules → lessons → lesson_progress
-- to calculate completion status per student per course

CREATE OR REPLACE VIEW public.course_completion_status AS
SELECT
  e.user_id as student_id,
  e.course_id,
  c.title as course_title,
  COUNT(DISTINCT l.id) FILTER (WHERE COALESCE(l.is_required, true)) as total_required_lessons,
  COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed AND COALESCE(l.is_required, true)) as completed_required_lessons,
  (COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed AND COALESCE(l.is_required, true))
   >=
   COUNT(DISTINCT l.id) FILTER (WHERE COALESCE(l.is_required, true))) as is_course_completed,
  MAX(lp.last_watched_at) as last_activity_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
LEFT JOIN modules m ON m.course_id = e.course_id
LEFT JOIN lessons l ON l.module_id = m.id
LEFT JOIN lesson_progress lp
  ON lp.student_id = e.user_id
  AND lp.lesson_id = l.id
GROUP BY e.user_id, e.course_id, c.title;

COMMENT ON VIEW public.course_completion_status IS
  'Derived view showing required vs completed lessons per student + course. Used for certificate eligibility.';

-- Grant access to authenticated users to view their own completion status
GRANT SELECT ON public.course_completion_status TO authenticated;
