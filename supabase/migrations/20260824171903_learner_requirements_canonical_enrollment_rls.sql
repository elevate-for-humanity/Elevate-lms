-- Align learner document visibility with program_enrollments, the canonical
-- enrollment authority used by the learner dashboard and My Courses.
ALTER TABLE public.enrollment_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own requirements" ON public.enrollment_requirements;
DROP POLICY IF EXISTS "Learners read canonical enrollment requirements" ON public.enrollment_requirements;
CREATE POLICY "Learners read canonical enrollment requirements"
ON public.enrollment_requirements
FOR SELECT
TO authenticated
USING (
  enrollment_id IN (
    SELECT pe.id
    FROM public.program_enrollments pe
    WHERE pe.user_id = (SELECT auth.uid())
       OR pe.student_id = (SELECT auth.uid())
  )
);

GRANT SELECT ON public.enrollment_requirements TO authenticated;
