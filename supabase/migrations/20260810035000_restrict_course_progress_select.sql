-- course_progress contained a blanket authenticated SELECT policy (USING true),
-- which allowed any signed-in user to read every learner's progress row.
-- Preserve learner self-access, permit assigned instructors to view the courses
-- they supervise, and permit operational Admin users. service_role continues to
-- bypass RLS for trusted server-side reporting.

DROP POLICY IF EXISTS "Allow authenticated read" ON public.course_progress;

DROP POLICY IF EXISTS "Assigned instructors can view course progress" ON public.course_progress;
CREATE POLICY "Assigned instructors can view course progress"
ON public.course_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.instructor_assignments ia
    WHERE ia.instructor_id = auth.uid()
      AND ia.course_id = course_progress.course_id
      AND ia.active = true
  )
);

DROP POLICY IF EXISTS "Admins can view course progress" ON public.course_progress;
CREATE POLICY "Admins can view course progress"
ON public.course_progress
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin', 'staff')
  )
);
