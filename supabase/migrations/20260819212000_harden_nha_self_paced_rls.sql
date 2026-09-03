BEGIN;

DROP POLICY IF EXISTS "Admins can manage flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Admins can manage practice activities" ON public.practice_activities;

DROP POLICY IF EXISTS flashcards_enrolled_read ON public.flashcards;
CREATE POLICY flashcards_enrolled_read ON public.flashcards
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.student_id = auth.uid()
      AND ce.course_id = flashcards.course_id
      AND ce.status = 'active'
  )
);

DROP POLICY IF EXISTS flashcards_admin_all ON public.flashcards;
CREATE POLICY flashcards_admin_all ON public.flashcards
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS practice_activities_enrolled_read ON public.practice_activities;
CREATE POLICY practice_activities_enrolled_read ON public.practice_activities
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.student_id = auth.uid()
      AND ce.course_id = practice_activities.course_id
      AND ce.status = 'active'
  )
);

DROP POLICY IF EXISTS practice_activities_admin_all ON public.practice_activities;
CREATE POLICY practice_activities_admin_all ON public.practice_activities
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS focused_reviews_own_select ON public.focused_reviews;
DROP POLICY IF EXISTS focused_reviews_own_insert ON public.focused_reviews;
DROP POLICY IF EXISTS focused_reviews_own_update ON public.focused_reviews;
CREATE POLICY focused_reviews_own_select ON public.focused_reviews
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY focused_reviews_own_insert ON public.focused_reviews
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY focused_reviews_own_update ON public.focused_reviews
FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS readiness_reports_admin_all ON public.readiness_reports;
CREATE POLICY readiness_reports_admin_all ON public.readiness_reports
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS course_module_settings_enrolled_read ON public.course_module_settings;
CREATE POLICY course_module_settings_enrolled_read ON public.course_module_settings
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.student_id = auth.uid()
      AND ce.course_id = course_module_settings.course_id
      AND ce.status = 'active'
  )
);
DROP POLICY IF EXISTS course_module_settings_admin_all ON public.course_module_settings;
CREATE POLICY course_module_settings_admin_all ON public.course_module_settings
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
